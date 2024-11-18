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
let repeatMode = 0;

function pathExistsInAll(path) {
  return playlists["All"].some((song) => song.path === path);
}

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const track = audioContext.createMediaElementSource(audio);

const repeatButton = document.getElementById("repeatButton");
repeatButton.addEventListener("click", toggleRepeatMode);

document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");
  const appContent = document.getElementById("app");
  let appReady = false;
  const mode = await window.electronAPI.getWindowMode();
  const fullPlayerWrapper = document.querySelector(".wrap");

  await loadAllPlaylists();
  await loadCurrentSongIndex();  
  displayPlaylist();

  if (mode === "minimized") {
    fullPlayerWrapper.style.left = "0";
    fullPlayerWrapper.style.top = "0";
  } 

  const dragBar = document.querySelector(".player-top");
  let isDraggingWrap = false; // Для wrap
  let offset = { x: 0, y: 0 };

  function isSmallWindow() {
    return window.innerWidth <= 500; // Маленьке вікно визначається як ширина <= 500px
  }

  function resetWrapPositionIfSmallWindow() {
    if (isSmallWindow()) {
      wrap.style.left = "0";
      wrap.style.top = "0";
      wrap.style.position = "absolute"; // Переконуємося, що позиція встановлена як абсолютна
      localStorage.removeItem("wrapPosition"); // Не зберігаємо позицію для маленького вікна
    }
  }

  // Завершення перетягування вікна
  document.addEventListener("mouseup", () => {
    if (isDraggingWrap) {
      isDraggingWrap = false;
      document.body.style.cursor = "default";

      // Зберігаємо позицію wrap у localStorage
      localStorage.setItem(
        "wrapPosition",
        JSON.stringify({
          left: wrap.style.left,
          top: wrap.style.top,
        })
      );
    }
  });

  // Перетягування вікна
  document.addEventListener("mousemove", (e) => {
    if (isDraggingWrap) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;

      const bodyRect = document.body.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();

      wrap.style.left = `${Math.max(0, Math.min(newX, bodyRect.width - wrapRect.width))}px`;
      wrap.style.top = `${Math.max(0, Math.min(newY, bodyRect.height - wrapRect.height))}px`;
    }
  });

  dragBar.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || e.target !== dragBar) return;

    const rect = wrap.getBoundingClientRect();
    isDraggingWrap = true;
    offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    document.body.style.cursor = "grabbing";
  });

  const savedWrapPosition = JSON.parse(localStorage.getItem("wrapPosition"));
  if (savedWrapPosition && !isSmallWindow()) {
    wrap.style.left = savedWrapPosition.left;
    wrap.style.top = savedWrapPosition.top;
  } else {
    resetWrapPositionIfSmallWindow();
  }

  // Подвійний клік для центрування wrap
  dragBar.addEventListener("dblclick", () => {
    if (isSmallWindow()) return; // Не дозволяємо центрування в маленькому вікні

    const bodyRect = document.body.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    const newLeft = (bodyRect.width - wrapRect.width) / 2;
    const newTop = (bodyRect.height - wrapRect.height) / 2;

    wrap.style.left = `${newLeft}px`;
    wrap.style.top = `${newTop}px`;

    // Зберігаємо нову позицію
    localStorage.setItem(
      "wrapPosition",
      JSON.stringify({ left: `${newLeft}px`, top: `${newTop}px` })
    );
  });

  window.addEventListener("resize", resetWrapPositionIfSmallWindow);
  resetWrapPositionIfSmallWindow();

  window.electronAPI.onAppReady(() => {
    appReady = true;
    hideLoaderAndShowApp();
  });

  function hideLoaderAndShowApp() {
    if (appReady) {
      if (loader) {
        loader.style.display = "none";
      }

      if (appContent) {
        appContent.style.display = "block";
      }

      window.electronAPI.showMainWindow();
    }
  }
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
        contextMenu.style.zIndex = "50";
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

function toggleRepeatMode() {
  repeatMode = (repeatMode + 1) % 3;

  switch (repeatMode) {
    case 0:
      repeatButton.innerHTML =
        '<svg class="no-repeat"><use href="img/sprite.svg#repeat"></use></svg>';
      break;
    case 1:
      repeatButton.innerHTML =
        '<svg class="repeat"><use href="img/sprite.svg#repeat"></use></svg>';
      break;
    case 2:
      repeatButton.innerHTML =
        '<svg class="repeat"><use href="img/sprite.svg#repeat-one"></use></svg>';
      break;
  }
}

document.getElementById("downloadButton").addEventListener("click", () => {
  const youtubeUrl = document.getElementById("youtubeInput").value.trim();

  if (!youtubeUrl) {
    alert("Please enter a valid YouTube URL.");
  } else if (!youtubeUrl.startsWith("https://www.youtube.com/watch?v=")) {
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
  const filteredSongs = songs.filter((song) => {
    const title = song.title ? song.title.toLowerCase() : "";
    const artist = song.artist ? song.artist.toLowerCase() : "";
    return title.includes(searchTerm) || artist.includes(searchTerm);
  });

  playlistElement.innerHTML = filteredSongs
    .map((song, index) => {
      const title = song.title || "Unknown Title";
      const artist = song.artist || "Unknown Artist";
      return `<li id="song-name" class="song-name" ${
        index === currentIndex ? 'style="font-weight: bold;"' : ""
      } data-index="${index}" data-path="${song.path}">${
        index + 1
      }. ${artist} - ${title}</li>`;
    })
    .join("");

  const songElements = document.querySelectorAll("#song-name");

  songElements.forEach((songElement) => {
    let fullText = songElement.textContent.trim();
    if (fullText.length > 40) {
      songElement.textContent = fullText.substring(0, 40) + "...";
    }
  });
}

function saveCurrentPlaylist() {
  playlists[currentPlaylistName] = playlists[currentPlaylistName] || [];
  saveAllPlaylists();
}

function playSongAtIndex(index) {
  const songs = playlists[currentPlaylistName] || [];
  if (index >= 0 && index < songs.length) {
    const savedData = {
      playlist: currentPlaylistName,
      index: index,
    };
    localStorage.setItem("currentSongIndex", JSON.stringify(savedData));
  } else {
    console.warn("Index out of bounds:", index);
  }
}

function next() {
  const songs = playlists[currentPlaylistName] || [];
  audio.src = `file://${songs[currentIndex].path}`

  if (repeatMode === 2) {
    playNewTrack(songs[currentIndex].path);
  } else {
    currentIndex = (currentIndex + 1) % playlists[currentPlaylistName].length;
    saveCurrentSongIndex(currentIndex);

    if (currentIndex === 0 && repeatMode === 0) {
      audio.pause();
      playStopButton.innerHTML = '<img src="img/play.png" alt="play" />';
      return;
    }
    displayPlaylist();
    playNewTrack(songs[currentIndex].path);
  }

  audio.play();
  playStopButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
}

function previous() {
  const songs = playlists[currentPlaylistName] || [];
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  saveCurrentSongIndex(currentIndex);
  audio.src = `file://${songs[currentIndex].path}`;
  audio.play();
  playStopButton.innerHTML = '<img src="img/pause.png" alt="pause" />';
  audio.addEventListener("ended", next);
  displayPlaylist();
  playNewTrack(songs[currentIndex].path);
}

async function selectFiles() {
  const filePaths = await window.electronAPI.selectAudioFiles();
  const songs = playlists[currentPlaylistName] || [];

  for (const filePath of filePaths) {
    const metadata = await window.electronAPI.getMetadata(filePath);
    const title = metadata && metadata.title ? metadata.title : "Unknown Title";
    const artist =
      metadata && metadata.artist ? metadata.artist : "Unknown Artist";
    let image = null;

    if (metadata && metadata.image && metadata.image.imageBuffer) {
      image = {
        data: metadata.image.imageBuffer,
        mime: metadata.image.mime,
      };
    }

    const song = {
      path: filePath,
      title: title,
      artist: artist,
      image: image,
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

async function playNewTrack(filePath) {
  if (!audio.paused) {
    audio.pause();
  }

  await new Promise((resolve) => {
    if (audio.paused) {
      resolve();
    } else {
      audio.onpause = () => {
        resolve();
        audio.onpause = null;
      };
    }
  });

  const exists = await window.electronAPI.checkFileExists(filePath);
  if (!exists) {
    console.warn(`File not found: ${filePath}, removing from playlists`);
    removeTrackFromPlaylistsByPath(filePath);
    saveAllPlaylists();
    displayPlaylist();
    return;
  }

  const metadata = await window.electronAPI.getMetadata(filePath);
  const song = playlists[currentPlaylistName].find((s) => s.path === filePath);
  const songTitle = song ? song.title : "Unknown Title";
  const artist = song ? song.artist : "Unknown Artist";

  let coverImageURL = "img/songback.png";
  if (metadata && metadata.image && metadata.image.data) {
    const arrayBuffer = new Uint8Array(metadata.image.data).buffer;
    const blob = new Blob([arrayBuffer], { type: metadata.image.mime });
    coverImageURL = URL.createObjectURL(blob);
  }

  try {
    const response = await fetch(`file://${filePath}`);
    if (response.ok) {
      const blob = await response.blob();
      const audioURL = URL.createObjectURL(blob);
      audio.src = audioURL;
    } else {
      console.error(`Failed to load audio file from path ${filePath}`);
      return;
    }
  } catch (error) {
    console.error(`Failed to load audio file from path ${filePath}:`, error);
    return;
  }

  const songNameElement = document.querySelector(".song-data .name");
  const artistElement = document.querySelector(".song-data .artist");
  const coverImageElement = document.getElementById("cover-image");

  if (songNameElement) {
    songNameElement.textContent = songTitle;
    applyScrollingIfNeeded(songNameElement);
  }
  if (artistElement) {
    artistElement.textContent = artist;
    applyScrollingIfNeeded(artistElement);
  }
  if (coverImageElement) {
    coverImageElement.src = coverImageURL;

    coverImageElement.onerror = () => {
      coverImageElement.src = "img/songback.png";
    };
  }

  audio.addEventListener(
    "canplay",
    async () => {
      try {
        await audio.play();
        isPlaying = true;
      } catch (error) {
        console.error("Error during audio playback:", error);
      }
    },
    { once: true }
  );

  audio.onended = () => {
    if (repeatMode === 2) {
      playNewTrack(filePath);
    } else {
      next();
    }
  };
}

function applyScrollingIfNeeded(element) {
  if (element.scrollWidth > element.clientWidth) {
    const innerSpan = document.createElement("span");
    innerSpan.classList.add("scrollable-text");
    innerSpan.textContent = element.textContent;

    element.innerHTML = "";
    element.appendChild(innerSpan);
  }
}

function getFileName(filePath) {
  return filePath.split("/").pop().split("\\").pop();
}

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
          console.warn(
            `Background file not found: ${background}, removing from settings`
          );
          removeBackgroundFromSettings(background);
          return;
        }
        const radioInput = document.createElement("input");
        radioInput.type = "radio";
        radioInput.name = "background";
        radioInput.value = background.replace(/\\/g, "/");
        radioInput.checked = background === settings.selectedBackground;
        radioInput.style.display = "none";
        radioInput.addEventListener("change", () =>
          selectBackground(background)
        );

        const label = document.createElement("label");
        label.className = "background-preview-label";
        label.style.display = "inline-block";
        label.style.margin = "5px";
        label.style.cursor = "pointer";
        label.innerHTML = `<img src="file://${background.replace(
          /\\/g,
          "/"
        )}" alt="Background ${
          index + 1
        }" class="background-preview" style="width: 100px; height: 100px; object-fit: cover;" />`;
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
      if (
        event.target.tagName === "IMG" &&
        event.target.classList.contains("background-preview")
      ) {
        if (contextMenu) {
          contextMenu.remove();
        }
        contextMenu = document.createElement("div");
        contextMenu.className = "context-menu";
        contextMenu.style.position = "fixed";
        contextMenu.style.zIndex = "50";
        contextMenu.style.top = `${event.clientY}px`;
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.innerHTML =
          '<button class="rc-menu-btn" id="deleteBackgroundButton">Delete</button>';
        document.body.appendChild(contextMenu);

        const backgroundPath =
          event.target.parentElement.querySelector("input").value;
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

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

class RotatingKnob {
  constructor(element, options) {
    this.element = element;
    this.min = options.min || -30;
    this.max = options.max || 30;
    this.onValueChange = options.onValueChange;
    this.localStorageKey = options.localStorageKey;
    this.knobColor = options.knobColor || "#00ffcc";

    this.init();
    const savedValue = localStorage.getItem(this.localStorageKey);
    this.updateKnobValue(
      savedValue !== null ? parseFloat(savedValue) : options.initialValue || 0
    );
  }

  init() {
    this.element.addEventListener("click", (e) => this.setKnobValue(e));
  }

  setKnobValue(e) {
    e.preventDefault();

    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    angle += 90;
    if (angle < 0) {
      angle += 360;
    }

    const value = (angle / 360) * (this.max - this.min) + this.min;

    if (this.onValueChange) {
      this.onValueChange(value);
    }

    this.updateKnobValue(value);

    localStorage.setItem(this.localStorageKey, value);
  }

  updateKnobValue(value) {
    const angle = ((value - this.min) / (this.max - this.min)) * 360;
    this.element.style.background = `conic-gradient(
        ${this.knobColor} ${angle}deg,
        #333333 ${angle}deg 360deg
      )`;
  }

  setKnobColor(color) {
    this.knobColor = color;
    localStorage.setItem(`${this.localStorageKey}_color`, color);
    const currentValue = localStorage.getItem(this.localStorageKey);
    this.updateKnobValue(currentValue !== null ? parseFloat(currentValue) : 0);
  }
}

const lowFilter = audioContext.createBiquadFilter();
lowFilter.type = "lowshelf";
lowFilter.frequency.setValueAtTime(200, audioContext.currentTime);

const midFilter = audioContext.createBiquadFilter();
midFilter.type = "peaking";
midFilter.frequency.setValueAtTime(1000, audioContext.currentTime);

const highFilter = audioContext.createBiquadFilter();
highFilter.type = "highshelf";
highFilter.frequency.setValueAtTime(3000, audioContext.currentTime);

track.connect(lowFilter);
lowFilter.connect(midFilter);
midFilter.connect(highFilter);
highFilter.connect(audioContext.destination);

document.addEventListener("DOMContentLoaded", () => {
  const savedColor1 = localStorage.getItem("lowKnobValue_color") || "#43e5f7";
  const savedColor2 = localStorage.getItem("midKnobValue_color") || "#43e5f7";
  const savedColor3 = localStorage.getItem("highKnobValue_color") || "#43e5f7";

  document.getElementById("equalizer1").value = savedColor1;
  document.getElementById("equalizer2").value = savedColor2;
  document.getElementById("equalizer3").value = savedColor3;
  const lowKnob = new RotatingKnob(document.getElementById("lowKnob"), {
    min: -20,
    max: 30,
    initialValue:
      localStorage.getItem("lowKnobValue") !== null
        ? parseFloat(localStorage.getItem("lowKnobValue"))
        : lowFilter.gain.value,
    localStorageKey: "lowKnobValue",
    knobColor: document.getElementById("equalizer1").value,
    onValueChange: (value) => {
      lowFilter.gain.setValueAtTime(value, audioContext.currentTime);
    },
  });

  const midKnob = new RotatingKnob(document.getElementById("midKnob"), {
    min: -30,
    max: 30,
    initialValue:
      localStorage.getItem("midKnobValue") !== null
        ? parseFloat(localStorage.getItem("midKnobValue"))
        : midFilter.gain.value,
    localStorageKey: "midKnobValue",
    knobColor: document.getElementById("equalizer2").value,
    onValueChange: (value) => {
      midFilter.gain.setValueAtTime(value, audioContext.currentTime);
    },
  });

  const highKnob = new RotatingKnob(document.getElementById("highKnob"), {
    min: -30,
    max: 30,
    initialValue:
      localStorage.getItem("highKnobValue") !== null
        ? parseFloat(localStorage.getItem("highKnobValue"))
        : highFilter.gain.value,
    localStorageKey: "highKnobValue",
    knobColor: document.getElementById("equalizer3").value,
    onValueChange: (value) => {
      highFilter.gain.setValueAtTime(value, audioContext.currentTime);
    },
  });

  document.getElementById("equalizer1").addEventListener("input", (e) => {
    lowKnob.setKnobColor(e.target.value);
  });

  document.getElementById("equalizer2").addEventListener("input", (e) => {
    midKnob.setKnobColor(e.target.value);
  });

  document.getElementById("equalizer3").addEventListener("input", (e) => {
    highKnob.setKnobColor(e.target.value);
  });
});

function hideLoaderAndShowApp() {
  if (appReady) {
    if (loader) {
      loader.classList.add("hidden");
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    }

    if (appContent) {
      appContent.style.display = "block";
    }

    window.electronAPI.showMainWindow();
  }
}

function saveCurrentSongIndex(index) {
  const songs = playlists[currentPlaylistName] || [];
  if (index >= 0 && index < songs.length) {
    const savedData = {
      playlist: currentPlaylistName,
      index: index,
    };
    localStorage.setItem("currentSongIndex", JSON.stringify(savedData));
  } else {
    console.warn("Index out of bounds:", index);
  }
}

async function loadCurrentSongIndex() {
  const savedData = JSON.parse(localStorage.getItem("currentSongIndex"));

  if (savedData && savedData.playlist && savedData.index !== undefined) {
    const { playlist, index } = savedData;

    // Перевіряємо наявність плейлиста та пісні
    if (playlists[playlist] && playlists[playlist][index]) {
      currentPlaylistName = playlist;
      currentIndex = index;

      const filePath = playlists[playlist][index].path;
      await loadSong(filePath); // Завантажуємо пісню без автоматичного запуску
    } else {
      console.warn(
        "Saved playlist or song index is invalid. Resetting to defaults."
      );
      resetToDefaultPlaylist();
    }
  } else {
    console.warn("No saved song index found. Loading default playlist.");
    resetToDefaultPlaylist();
  }
}


async function loadSong(filePath) {
  const exists = await window.electronAPI.checkFileExists(filePath);

  if (!exists) {
    console.warn(`File not found: ${filePath}, removing from playlists`);
    removeTrackFromPlaylistsByPath(filePath);
    saveAllPlaylists();
    displayPlaylist();
    return;
  }

  const metadata = await window.electronAPI.getMetadata(filePath);
  const song = playlists[currentPlaylistName].find((s) => s.path === filePath);
  const songTitle = song ? song.title : "Unknown Title";
  const artist = song ? song.artist : "Unknown Artist";

  let coverImageURL = "img/songback.png";
  if (metadata && metadata.image && metadata.image.data) {
    const arrayBuffer = new Uint8Array(metadata.image.data).buffer;
    const blob = new Blob([arrayBuffer], { type: metadata.image.mime });
    coverImageURL = URL.createObjectURL(blob);
  }

  try {
    const response = await fetch(`file://${filePath}`);
    if (response.ok) {
      const blob = await response.blob();
      const audioURL = URL.createObjectURL(blob);
      audio.src = audioURL; // Завантажуємо файл у плеєр
    } else {
      console.error(`Failed to load audio file from path ${filePath}`);
      return;
    }
  } catch (error) {
    console.error(`Failed to load audio file from path ${filePath}:`, error);
    return;
  }

  // Оновлюємо метадані плеєра
  const songNameElement = document.querySelector(".song-data .name");
  const artistElement = document.querySelector(".song-data .artist");
  const coverImageElement = document.getElementById("cover-image");

  if (songNameElement) {
    songNameElement.textContent = songTitle;
    applyScrollingIfNeeded(songNameElement);
  }
  if (artistElement) {
    artistElement.textContent = artist;
    applyScrollingIfNeeded(artistElement);
  }
  if (coverImageElement) {
    coverImageElement.src = coverImageURL;

    coverImageElement.onerror = () => {
      coverImageElement.src = "img/songback.png";
    };
  }

  isPlaying = false; // Зупиняємо автоматичне відтворення
}

function resetToDefaultPlaylist() {
  currentPlaylistName = "All";
  currentIndex = 0;
  if (playlists["All"] && playlists["All"][0]) {
    const filePath = playlists["All"][0].path;
    loadSong(filePath);
  }
}
 