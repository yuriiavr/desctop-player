let audio = new Audio();
let savedVolume = localStorage.getItem("savedVolume") || 1.0;
audio.volume = savedVolume;
const volumeControl = document.getElementById("volumeControl");
if (volumeControl) {
  volumeControl.value = savedVolume;
}
let playlists = {};
let currentPlaylistName = "All";
let currentIndex = 0;
let savedSortBy = localStorage.getItem("savedSortBy") || "title";

let sortable;
let isPlaying = false;
let contextMenu;

function pathExistsInAll(path) {
  return playlists["All"].some((song) => song.path === path);
}

document.getElementById("downloadButton").addEventListener("click", () => {
  const youtubeUrl = document.getElementById("youtubeInput").value.trim();

  if (!youtubeUrl) {
    alert("Please enter a valid YouTube URL.");
  }

  else if (!youtubeUrl.startsWith("https://www.youtube.com/watch?v=")) {
    alert("The URL is invalid");
  } else {
    window.electronAPI.startDownload(youtubeUrl);
  }
});

const playStopButton = document.getElementById("play");
playStopButton.addEventListener("click", togglePlayPause);

function togglePlayPause() {
  if (audio.paused && audio.src) {
    audio
      .play()
      .then(() => {
        isPlaying = true;
        playStopButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
      })
      .catch((error) => console.error("Error during audio playback:", error));
  } else {
    audio.pause();
    isPlaying = false;
    playStopButton.innerHTML = '<img src="img/play.png" alt="play" />';
  }
}

function playNewTrack(filePath) {
  if (!audio.paused) {
    audio.pause();
  }
  window.electronAPI.checkFileExists(filePath).then((exists) => {
    if (!exists) {
      console.warn(`File not found: ${filePath}, removing from playlists`);
      removeTrackFromPlaylistsByPath(filePath);
      saveAllPlaylists();
      displayPlaylist();
      return;
    }
    audio.src = `file://${filePath}`;
    audio
      .play()
      .then(() => {
        isPlaying = true;
        playStopButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
      })
      .catch((error) => console.error("Error during audio playback:", error));
  });
}

function removeTrackFromPlaylistsByPath(path) {
  for (const playlistName in playlists) {
    playlists[playlistName] = playlists[playlistName].filter(
      (song) => song.path !== path
    );
  }
}

document.getElementById("playlist").addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    const filePath = event.target.getAttribute("data-path");
    playNewTrack(filePath);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const playlistsDiv = document.getElementById("playlistsDiv");
  const playlistsDropdown = document.getElementById("playlistsDropdown");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  await loadBackgrounds();

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

  await loadAllPlaylists();
  displayPlaylistsDropdown();

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
        if (contextMenu) {
          contextMenu.remove();
        }

        // Create context menu
        contextMenu = document.createElement("div");
        contextMenu.className = "context-menu";
        contextMenu.style.position = `fixed`;
        contextMenu.style.zIndex = '50';
        contextMenu.style.top = `${event.clientY}px`;
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.innerHTML =
          '<button class="rc-menu-btn" id="renameTrackButton">Rename</button><button class="rc-menu-btn" id="deleteTrack">Delete</button>';
        document.body.appendChild(contextMenu);

        document
          .getElementById("renameTrackButton")
          .addEventListener("click", () => {
            const trackIndex = Array.from(playlistElement.children).indexOf(
              event.target
            );
            if (
              playlists[currentPlaylistName] &&
              playlists[currentPlaylistName][trackIndex]
            ) {
              const liElement = event.target;
              const currentArtist =
                playlists[currentPlaylistName][trackIndex].artist;
              const currentTitle =
                playlists[currentPlaylistName][trackIndex].title;
              const currentText = `${currentArtist} - ${currentTitle}`;

              const input = document.createElement("input");
              input.type = "text";
              input.value = currentText;
              input.classList.add("renameInp");
              liElement.innerHTML = "";
              liElement.appendChild(input);
              input.focus();

              const errorMessage = document.createElement("div");
              errorMessage.style.color = "red";
              errorMessage.style.fontSize = "14px";
              errorMessage.style.display = "none";
              errorMessage.style.marginTop = "5px";
              errorMessage.textContent =
                "Please use the format 'Artist - Title' to rename the track.";
              liElement.appendChild(errorMessage);

              const confirmChanges = () => {
                const newText = input.value.trim();
                if (newText) {
                  const parts = newText.split(" - ");
                  if (parts.length === 2) {
                    const artist = parts[0].trim();
                    const title = parts[1].trim();

                    playlists[currentPlaylistName][trackIndex].artist = artist;
                    playlists[currentPlaylistName][trackIndex].title = title;
                    saveAllPlaylists();
                    displayPlaylist();
                    errorMessage.style.display = "none";
                  } else {
                    errorMessage.style.display = "block";
                    input.focus();
                  }
                } else {
                  input.value = currentText;
                  input.focus();
                }
              };

              input.addEventListener("blur", () => {
                confirmChanges();
              });

              input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  confirmChanges();
                }
              });
            }
            contextMenu.remove();
          });

        document.getElementById("deleteTrack").addEventListener("click", () => {
          const trackIndex = Array.from(playlistElement.children).indexOf(
            event.target
          );
          if (
            playlists[currentPlaylistName] &&
            playlists[currentPlaylistName][trackIndex]
          ) {
            const trackPath = playlists[currentPlaylistName][trackIndex].path;
            playlists[currentPlaylistName].splice(trackIndex, 1);
            saveAllPlaylists();
            displayPlaylist();
            removeTrackFromPlaylistsByPath(trackPath);
          }
          contextMenu.remove();
        });
      }
    });
  }

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
        } data-index="${index}" data-path="${song.path}">${index + 1}. ${
          song.artist
        } - ${song.title}</li>`
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
    const songDataName = document.querySelector(".song-data .name");
    const songDataArtist = document.querySelector(".song-data .artist");
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

    if (currentPlaylistName !== "All") {
      playlists[currentPlaylistName].push(song);
      if (!pathExistsInAll(filePath)) {
        playlists["All"].push(song);
      }
    } else if (!pathExistsInAll(filePath)) {
      playlists["All"].push(song);
    }
  }

  playlists[currentPlaylistName] = songs;
  updateAllPlaylist();
  displayPlaylist();
  saveAllPlaylists();
}

// Function to get the file name without path
function getFileName(filePath) {
  return filePath.split("/").pop().split("\\").pop();
}

// Function to parse the file name into artist and title
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
  const currentTimeElement = document.getElementById("currentTime");
  const durationTimeElement = document.getElementById("durationTime");

  if (progressBar) {
    progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
  }

  if (currentTimeElement) {
    currentTimeElement.textContent = formatTime(audio.currentTime);
  }

  if (durationTimeElement) {
    durationTimeElement.textContent = isNaN(audio.duration)
      ? "0:00"
      : formatTime(audio.duration);
  }
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

audio.addEventListener("timeupdate", updateProgressBar);

audio.addEventListener("loadedmetadata", updateProgressBar);

function updateAllPlaylist() {
  playlists["All"] = Object.keys(playlists)
    .filter((name) => name !== "All")
    .reduce((allSongs, playlistName) => {
      return allSongs.concat(playlists[playlistName]);
    }, [])
    .filter(
      (song, index, self) =>
        self.findIndex((s) => s.path === song.path) === index
    );
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
  document.getElementById("loadingModal").style.display = "flex";
});

window.electronAPI.onHideLoadingModal(() => {
  document.getElementById("loadingModal").style.display = "none";
});

function startDownload(youtubeUrl) {
  ipcRenderer.send("start-download", youtubeUrl);
}

window.electronAPI.onUpdateProgress((event, data) => {
  const progressBar = document.getElementById("progressDownloadBar");
  const progressText = document.getElementById("progressText");

  console.log("Received progress update:", data);

  if (data.progress) {
    progressBar.value = data.progress;
  }
  if (data.stage) {
    progressText.textContent = `${data.stage}`;
  }
});

document
  .getElementById("chooseChromeButton")
  .addEventListener("click", async () => {
    const chromePath = await window.electronAPI.chooseChromePath();
    if (chromePath) {
      alert(`Path to Chrome: ${chromePath}`);
    } else {
      alert("You use the default path");
    }
  });

document.getElementById("off-btn").addEventListener("click", () => {
  window.electronAPI.exitApp();
});

async function loadBackgrounds() {
  try {
    const settings = await window.electronAPI.loadBackgrounds();
    if (!settings || !Array.isArray(settings.backgrounds)) {
      console.error("Invalid backgrounds data.");
      return;
    }
    const backgroundsDiv = document.getElementById("backgrounds");
    backgroundsDiv.innerHTML = "";
    settings.backgrounds.forEach((background, index) => {
      window.electronAPI.checkFileExists(background).then((exists) => {
        if (!exists) {
          console.warn(`Background file not found: ${background}, removing from settings`);
          removeBackgroundFromSettings(background);
          return;
        }
        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.name = "background";
        radioInput.value = background.replace(/\\/g, "/");
        radioInput.checked = background === settings.selectedBackground;
        radioInput.style.display = "none";
        radioInput.addEventListener("change", () => selectBackground(background));

        const label = document.createElement("label");
        label.className = "background-preview-label";
        label.style.display = "inline-block";
        label.style.margin = "5px";
        label.style.cursor = "pointer";
        label.innerHTML = `<img src="file://${background.replace(/\\/g, "/")}" alt="Background ${index + 1}" class="background-preview" style="width: 100px; height: 100px; object-fit: cover;" />`;
        label.appendChild(radioInput);
        backgroundsDiv.appendChild(label);
      });
    });

    if (settings.selectedBackground) {
      document.body.style.backgroundImage = `url('file://${settings.selectedBackground.replace(
        /\\/g,
        "/"
      )}')`;
    } else {
      console.warn(
        `Selected background file not found: ${settings.selectedBackground}`
      );
    }
    backgroundsDiv.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      if (event.target.tagName === "IMG" && event.target.classList.contains("background-preview")) {
        if (contextMenu) {
          contextMenu.remove();
        }
        contextMenu = document.createElement("div");
        contextMenu.className = "context-menu";
        contextMenu.style.position = "fixed";
        contextMenu.style.zIndex = '50';
        contextMenu.style.top = `${event.clientY}px`;
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.innerHTML =
          '<button class="rc-menu-btn" id="deleteBackgroundButton">Delete</button>';
        document.body.appendChild(contextMenu); 

        const backgroundPath = event.target.parentElement.querySelector("input").value;
        document
          .getElementById("deleteBackgroundButton")
          .addEventListener("click", async () => {
            await window.electronAPI.deleteBackground(backgroundPath);
            await loadBackgrounds();
            contextMenu.remove();
          });
      }
    });
    
  } catch (error) {
    console.error("Failed to load backgrounds:", error);
  }
}
 
function removeBackgroundFromSettings(backgroundPath) {
  window.electronAPI.removeBackground(backgroundPath).then(() => {
    loadBackgrounds();
  });
}

async function selectBackgroundImages() {
  try {
    const settings = await window.electronAPI.selectBackgroundImages();
    loadBackgrounds();
  } catch (error) {
    console.error("Failed to select background images:", error);
  }
}

async function selectBackground(selectedBackground) {
  await window.electronAPI.saveSelectedBackground(
    selectedBackground.replace(/\\/g, "/")
  );
  document.body.style.backgroundImage = `url('file://${selectedBackground.replace(
    /\\/g,
    "/"
  )}')`;
}