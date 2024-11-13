// renderer.js
let audio = new Audio();
let savedVolume = localStorage.getItem("savedVolume") || 1.0;
audio.volume = savedVolume;
const volumeControl = document.getElementById("volumeControl");
if (volumeControl) {
  volumeControl.value = savedVolume;
}
let playlists = {}; // Об’єкт для зберігання кількох плейлистів
let currentPlaylistName = "All";
let currentIndex = 0;
let savedSortBy = localStorage.getItem("savedSortBy") || "title"; // Завантаження збереженого значення сортування // Змінна для зберігання вибору сортування

let sortable;

document.getElementById("downloadButton").addEventListener("click", () => {
  const youtubeUrl = document.getElementById("youtubeInput").value.trim();
  if (youtubeUrl) {
    window.electronAPI.startDownload(youtubeUrl);
  } else {
    alert("Please enter a valid YouTube URL.");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const playlistsDiv = document.getElementById("playlistsDiv");
  const playlistsDropdown = document.getElementById("playlistsDropdown");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  let contextMenu;

  if (playlistsDiv && playlistsDropdown) {
    playlistsDiv.addEventListener("click", (event) => {
      event.stopPropagation();
      playlistsDropdown.style.display =
        playlistsDropdown.style.display === "none" ||
        playlistsDropdown.style.display === ""
          ? "flex"
          : "none";
    });

    playlistsDropdown.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedPlaylist = event.target.textContent;
      if (selectedPlaylist in playlists) {
        currentPlaylistName = selectedPlaylist;
        playlistsDiv.textContent = selectedPlaylist;
        playlistsDropdown.style.display = "none";
        displayPlaylist();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !playlistsDiv.contains(event.target) &&
        !playlistsDropdown.contains(event.target)
      ) {
        playlistsDropdown.style.display = "none";
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      displayPlaylist();
    });
  }

  if (sortSelect) {
    sortSelect.value = savedSortBy;
    sortSelect.addEventListener("change", () => {
      savedSortBy = sortSelect.value;
      localStorage.setItem("savedSortBy", savedSortBy);
      sortPlaylist(savedSortBy);
      displayPlaylist();
    }); 
  } 
 
  const createPlaylistButton = document.getElementById("createPlaylistButton");
  const savePlaylistButton = document.getElementById("savePlaylistButton");
  const deletePlaylistButton = document.getElementById("deletePlaylistButton");

  if (createPlaylistButton) {
    createPlaylistButton.addEventListener("click", createPlaylist);
  }
  if (savePlaylistButton) {
    savePlaylistButton.addEventListener("click", saveCurrentPlaylist);
  }
  if (deletePlaylistButton) {
    deletePlaylistButton.addEventListener("click", deleteCurrentPlaylist);
  }

  await loadAllPlaylists(); // Завантаження всіх збережених плейлистів при запуску
  displayPlaylistsDropdown();

  // Додаємо обробник для клікабельних пісень у плейлисті
  const playlistElement = document.getElementById("playlist");
  if (playlistElement) {
    playlistElement.addEventListener("click", (event) => {
      if (
        event.target.tagName === "LI" &&
        !event.target.querySelector("input")
      ) {
        const songIndex = Array.from(playlistElement.children).indexOf(
          event.target
        );
        playSongAtIndex(songIndex);
      }
    });

    playlistElement.addEventListener("contextmenu", (event) => {
        event.preventDefault();    
        if (event.target.tagName === "LI") {
            // Remove existing context menu if any
            if (contextMenu) {
                contextMenu.remove();
            }
    
            // Create context menu
            contextMenu = document.createElement("div");
            contextMenu.className = "context-menu";
            contextMenu.style.position = `fixed`;
            contextMenu.style.top = `${event.clientY}px`;
            contextMenu.style.left = `${event.clientX}px`;
            contextMenu.innerHTML = '<button id="renameTrackButton">Rename</button>';
            document.body.appendChild(contextMenu);

    
            // Add click event to Rename button
            document
                .getElementById("renameTrackButton")
                .addEventListener("click", () => {
                    const trackIndex = Array.from(playlistElement.children).indexOf(event.target);
                    if (playlists[currentPlaylistName] && playlists[currentPlaylistName][trackIndex]) {
                        const liElement = event.target;
                        const currentArtist = playlists[currentPlaylistName][trackIndex].artist;
                        const currentTitle = playlists[currentPlaylistName][trackIndex].title;
                        const currentText = `${currentArtist} - ${currentTitle}`;
    
                        // Create an input element to rename track
                        const input = document.createElement("input");
                        input.type = "text";
                        input.value = currentText;
                        input.classList.add("renameInp");
                        liElement.innerHTML = "";
                        liElement.appendChild(input);
                        input.focus();
    
                        // Create an error message element
                        const errorMessage = document.createElement("div");
                        errorMessage.style.color = "red";
                        errorMessage.style.fontSize = "14px";
                        errorMessage.style.display = "none";
                        errorMessage.style.marginTop = "5px"; 
                        errorMessage.textContent = "Please use the format 'Artist - Title' to rename the track.";
                        liElement.appendChild(errorMessage);
    
                        // Function to confirm changes
                        const confirmChanges = () => {
                            const newText = input.value.trim();
                            if (newText) {
                                const parts = newText.split(' - ');
                                if (parts.length === 2) {
                                    const artist = parts[0].trim();
                                    const title = parts[1].trim();
    
                                    // Save data if the format is correct
                                    playlists[currentPlaylistName][trackIndex].artist = artist;
                                    playlists[currentPlaylistName][trackIndex].title = title;
                                    saveAllPlaylists();
                                    displayPlaylist(); // Update the playlist after editing
                                    errorMessage.style.display = "none"; // Hide error message
                                } else {
                                    // Show error message if format is incorrect
                                    errorMessage.style.display = "block";
                                    input.focus(); // Keep focus to allow user to correct
                                }
                            } else {
                                input.value = currentText; // Revert back to the previous value
                                input.focus(); // Refocus to allow correction
                            }
                        };
    
                        // Add blur event to handle changes
                        input.addEventListener("blur", () => {
                            confirmChanges();
                        });
    
                        // Add keydown event for Enter key
                        input.addEventListener("keydown", (e) => {
                            if (e.key === "Enter") {
                                confirmChanges();
                            }
                        });
                    }
                    contextMenu.remove();
                });
        }
    });
    
  }

  // Enable sorting via drag-and-drop using SortableJS
  if (playlistElement) {
    sortable = new Sortable(playlistElement, {
      animation: 150,
      onEnd: () => {
        reorderPlaylist();
        saveAllPlaylists();
      },
    });
  }

  // Volume and progress bar controls
  const volumeControl = document.getElementById("volumeControl");
  if (volumeControl) {
    volumeControl.addEventListener("input", (event) => {
      audio.volume = event.target.value;
      localStorage.setItem("savedVolume", audio.volume);
    });
  }

  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.addEventListener("input", (event) => {
      audio.currentTime = (event.target.value / 100) * audio.duration;
    });
  }

  audio.addEventListener("timeupdate", updateProgressBar);

  // Close context menu on click elsewhere
  document.addEventListener("click", (event) => {
    if (contextMenu && !contextMenu.contains(event.target)) {
      contextMenu.remove();
    }
  });
});

async function loadAllPlaylists() {
  playlists = (await window.electronAPI.loadPlaylists()) || {};
  if (!("All" in playlists)) {
    playlists["All"] = [];
  }
  updateAllPlaylist();
  displayPlaylist();
}

function saveAllPlaylists() {
  updateAllPlaylist();
  window.electronAPI.savePlaylists(playlists);
}

function createPlaylist() {
  const playlistName = document.getElementById("playlistName").value.trim();
  if (playlistName && !(playlistName in playlists) && playlistName !== "All") {
    playlists[playlistName] = [];
    currentPlaylistName = playlistName;
    displayPlaylistsDropdown();
    displayPlaylist(); 
    saveAllPlaylists();
  }
}

function renameCurrentPlaylist() {
  const newName = document.getElementById("renamePlaylistInput").value.trim();
  if (newName && newName !== currentPlaylistName && !(newName in playlists)) {
    playlists[newName] = playlists[currentPlaylistName]; 
    delete playlists[currentPlaylistName];
    currentPlaylistName = newName;
    displayPlaylistsDropdown();
    displayPlaylist(); 
    saveAllPlaylists();
  }
}

function deleteCurrentPlaylist() {
  if (currentPlaylistName in playlists && currentPlaylistName !== "All") {
    delete playlists[currentPlaylistName];
    updateAllPlaylist();
    currentPlaylistName = Object.keys(playlists)[0] || "All";
    displayPlaylistsDropdown();
    displayPlaylist();
    saveAllPlaylists();
  }
}

function displayPlaylistsDropdown() {
  const dropdown = document.getElementById("playlistsDropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "";
  Object.keys(playlists).forEach((name) => {
    const option = document.createElement("div");
    option.className = "playlist-option";
    option.textContent = name;
    dropdown.appendChild(option);
  });
  const playlistsDiv = document.getElementById("playlistsDiv");
  if (playlistsDiv) {
    playlistsDiv.textContent = currentPlaylistName;
  }
}

function displayPlaylist() {
    const playlistElement = document.getElementById("playlist");
    if (!playlistElement) return;
    const searchTerm = document.getElementById("searchInput")
      ? document.getElementById("searchInput").value.toLowerCase()
      : "";
    const songs = playlists[currentPlaylistName] || [];
    const filteredSongs = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm) ||
        song.artist.toLowerCase().includes(searchTerm)
    );
  
    playlistElement.innerHTML = filteredSongs
      .map(
        (song, index) =>
          `<li id="song-name" class="song-name" ${
            index === currentIndex ? 'style="font-weight: bold;"' : ""
          } data-index="${index}">${index + 1}. ${song.artist} - ${song.title}</li>`
      )
      .join("");
  
    const songElements = document.querySelectorAll("#song-name");
  
    songElements.forEach((songElement) => {
      let fullText = songElement.textContent.trim();
      if (fullText.length > 40) {  
        songElement.textContent = fullText.substring(0, 40) + "...";
      }
    });
    if (filteredSongs.length > 0) {
      const songDataName = document.querySelector('.song-data .name');
      const songDataArtist = document.querySelector('.song-data .artist');
      if (songDataName && songDataArtist) {
        songDataName.textContent = filteredSongs[currentIndex].title;
        songDataArtist.textContent = filteredSongs[currentIndex].artist;
      }
    }
      
  }
  

function saveCurrentPlaylist() {
  playlists[currentPlaylistName] = playlists[currentPlaylistName] || [];
  saveAllPlaylists();
}

function play() {
  const songs = playlists[currentPlaylistName] || [];
  const playButton = document.getElementById("play");
  if (songs.length > 0) {
    if (audio.paused || audio.src !== `file://${songs[currentIndex].path}`) {
      audio.src = `file://${songs[currentIndex].path}`;
      audio.play();
      playButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
      audio.onended = () => next();
    } else {
      audio.pause();
      playButton.innerHTML = '<img src="img/play.png" alt="play" />';
    }
    displayPlaylist();
  } else {
    console.error(
      "Playlist is empty. Please add songs to the playlist before playing."
    );
  }
}

function playSongAtIndex(index) {
  currentIndex = index;
  audio.src = `file://${playlists[currentPlaylistName][currentIndex].path}`;
  audio.play();
  const playButton = document.getElementById("play");
  playButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
  audio.onended = () => next();
  displayPlaylist();
}

function next() {
  const songs = playlists[currentPlaylistName] || [];
  currentIndex = (currentIndex + 1) % songs.length;
  audio.src = `file://${songs[currentIndex].path}`;
  audio.play();
  const playButton = document.getElementById("play");
  playButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
  audio.onended = () => next();
  displayPlaylist();
}

function previous() {
  const songs = playlists[currentPlaylistName] || [];
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  audio.src = `file://${songs[currentIndex].path}`;
  audio.play();
  const playButton = document.getElementById("play");
  playButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
  audio.onended = () => next();
  displayPlaylist();
}

async function selectFiles() {
  const filePaths = await window.electronAPI.selectAudioFiles();
  const songs = playlists[currentPlaylistName] || [];

  for (const filePath of filePaths) {
    const fileName = getFileName(filePath);
    const { artist, title } = parseFileName(fileName);
    const song = {
      path: filePath,
      title: title,
      artist: artist,
      addedAt: new Date().toISOString(),
    };
    songs.push(song);
    if (currentPlaylistName !== "All") {
      playlists["All"].push(song);
    }
  }

  playlists[currentPlaylistName] = songs;
  updateAllPlaylist();
  displayPlaylist();
  saveAllPlaylists();
}

// Функція для витягування імені файлу без шляху
function getFileName(filePath) {
  return filePath.split("/").pop().split("\\").pop();
}

// Функція для парсингу імені файлу на виконавця та назву
function parseFileName(fileName) {
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const parts = nameWithoutExtension.split(" - ");

  if (parts.length === 2) {
    return {
      artist: parts[0].trim(),
      title: parts[1].trim(),
    };
  } else {
    return {
      artist: "Unknown Artist",
      title: nameWithoutExtension,
    };
  }
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;
  progressBar.value = (audio.currentTime / audio.duration) * 100;
  const currentTimeElement = document.getElementById("currentTime");
  const durationTimeElement = document.getElementById("durationTime");
  if (currentTimeElement) {
    currentTimeElement.textContent = formatTime(audio.currentTime);
  }
  if (durationTimeElement) {
    durationTimeElement.textContent = formatTime(audio.duration);
  }
}

function updateAllPlaylist() {
  playlists["All"] = Object.keys(playlists)
    .filter((name) => name !== "All")
    .reduce((allSongs, playlistName) => {
      return allSongs.concat(playlists[playlistName]);
    }, []);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function sortPlaylist(criteria) {
  const songs = playlists[currentPlaylistName] || [];
  switch (criteria) {
    case "title":
      songs.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "artist":
      songs.sort((a, b) => a.artist.localeCompare(b.artist));
      break;
    case "date":
      songs.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
      break;
  }
  playlists[currentPlaylistName] = songs;
}

function reorderPlaylist() {
  const playlistElement = document.getElementById("playlist");
  if (!playlistElement) return;
  const reorderedSongs = Array.from(playlistElement.children).map((item) => {
    const index = parseInt(item.getAttribute("data-index"));
    return playlists[currentPlaylistName][index];
  });
  playlists[currentPlaylistName] = reorderedSongs;
}

window.electronAPI.showLoadingModal();

window.electronAPI.onShowLoadingModal(() => {
    document.getElementById('loadingModal').style.display = 'flex';
});

window.electronAPI.onHideLoadingModal(() => {
    document.getElementById('loadingModal').style.display = 'none';
});