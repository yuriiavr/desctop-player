const openListBtn = document.getElementById("playlist-btn");
const openDownloadBtn = document.getElementById("ytdownload");
const openSettingsBtn = document.getElementById("settings");

const openListWrap = document.getElementById("playlist-wrap");
const openDownloadWrap = document.getElementById("download-wrap");
const openSettingsWrap = document.getElementById("settings-wrap");

function toggleExclusive(openElement, ...closeElements) {
  if (openElement.style.display === "flex") {
    openElement.style.display = "none";
  } else {
    closeElements.forEach((el) => (el.style.display = "none"));
    openElement.style.display = "flex";
  }
  saveDisplayState();
}

openListBtn.addEventListener("click", function () {
  toggleExclusive(openListWrap, openDownloadWrap, openSettingsWrap);
});

openDownloadBtn.addEventListener("click", function () {
  toggleExclusive(openDownloadWrap, openListWrap, openSettingsWrap);
});

openSettingsBtn.addEventListener("click", function () {
  toggleExclusive(openSettingsWrap, openListWrap, openDownloadWrap);
});

const space = document.getElementById("space");
const createPlaylistCont = document.getElementById("createPlaylistCont");
const renamePlaylistCont = document.getElementById("rename-playlist");
const deletePlaylistCont = document.getElementById("delete-playlist");

const renamePlaylistButton = document.getElementById("renamePlaylistButton");
const deletePlaylistButton = document.getElementById("deletePlaylist");
const createPlaylistButton = document.getElementById("createPlaylist");
const notDeleteButton = document.getElementById("notDelete");

function toggleVisibility(button, container) {
  if (container.style.display === "flex") {
    container.style.display = "none";
    space.style.display = "block";
  } else {
    createPlaylistCont.style.display = "none";
    renamePlaylistCont.style.display = "none";
    deletePlaylistCont.style.display = "none";
    space.style.display = "none";
    container.style.display = "flex";
  }
  saveDisplayState();
}

createPlaylistButton.addEventListener("click", () => {
  toggleVisibility(createPlaylistButton, createPlaylistCont);
});

renamePlaylistButton.addEventListener("click", () => {
  toggleVisibility(renamePlaylistButton, renamePlaylistCont);
});

deletePlaylistButton.addEventListener("click", () => {
  toggleVisibility(deletePlaylistButton, deletePlaylistCont);
});

notDeleteButton.addEventListener("click", () => {
  createPlaylistCont.style.display = "none";
  renamePlaylistCont.style.display = "none";
  deletePlaylistCont.style.display = "none";
  space.style.display = "block";
  saveDisplayState();
});

// Save display state to localStorage
function saveDisplayState() {
  const displayState = {
    playlistWrap: openListWrap.style.display,
    downloadWrap: openDownloadWrap.style.display,
    settingsWrap: openSettingsWrap.style.display,
    createPlaylistCont: createPlaylistCont.style.display,
    renamePlaylistCont: renamePlaylistCont.style.display,
    deletePlaylistCont: deletePlaylistCont.style.display,
    space: space.style.display,
  };
  localStorage.setItem("displayState", JSON.stringify(displayState));
}

// Load display state from localStorage
function loadDisplayState() {
  const displayState = JSON.parse(localStorage.getItem("displayState"));
  if (displayState) {
    openListWrap.style.display = displayState.playlistWrap;
    openDownloadWrap.style.display = displayState.downloadWrap;
    openSettingsWrap.style.display = displayState.settingsWrap;
    createPlaylistCont.style.display = displayState.createPlaylistCont;
    renamePlaylistCont.style.display = displayState.renamePlaylistCont;
    deletePlaylistCont.style.display = displayState.deletePlaylistCont;
    space.style.display = displayState.space;
  }
}

//clock

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const timeString = `${hours}:${minutes}:${seconds}`;
  const spans = document.querySelectorAll("#clock span");

  for (let i = 0; i < spans.length; i++) {
    spans[i].textContent = timeString[i];
  }
}

setInterval(updateClock, 1000);
updateClock();

// Clock customization controls
const fontSizeInput = document.getElementById("font-size");
const gradientStartInput = document.getElementById("gradient-start");
const gradientEndInput = document.getElementById("gradient-end");

fontSizeInput.addEventListener("input", () => {
  const spans = document.querySelectorAll("#clock span");
  spans.forEach((span) => {
    span.style.fontSize = `${fontSizeInput.value}px`;
  });
  saveClockSettings();
});

gradientStartInput.addEventListener("input", () => {
  updateClockBackground();
  saveClockSettings();
});

gradientEndInput.addEventListener("input", () => {
  updateClockBackground();
  saveClockSettings();
});

function updateClockBackground() {
  const spans = document.querySelectorAll("#clock span");
  spans.forEach((span) => {
    span.style.backgroundImage = `linear-gradient(135deg, ${gradientStartInput.value}, ${gradientEndInput.value})`;
    span.style.webkitBackgroundClip = "text";
    span.style.webkitTextFillColor = "transparent";
  });
}

// Save clock settings to localStorage
function saveClockSettings() {
  const clockSettings = {
    fontSize: fontSizeInput.value,
    gradientStart: gradientStartInput.value,
    gradientEnd: gradientEndInput.value,
  };
  localStorage.setItem("clockSettings", JSON.stringify(clockSettings));
}

// Load clock settings from localStorage
function loadClockSettings() {
  const clockSettings = JSON.parse(localStorage.getItem("clockSettings"));
  if (clockSettings) {
    fontSizeInput.value = clockSettings.fontSize;
    gradientStartInput.value = clockSettings.gradientStart;
    gradientEndInput.value = clockSettings.gradientEnd;

    const spans = document.querySelectorAll("#clock span");
    spans.forEach((span) => {
      span.style.fontSize = `${clockSettings.fontSize}px`;
      span.style.backgroundImage = `linear-gradient(135deg, ${clockSettings.gradientStart}, ${clockSettings.gradientEnd})`;
      span.style.webkitBackgroundClip = "text";
      span.style.webkitTextFillColor = "transparent";
    });
  }
}

const displayToggle = document.getElementById("display-toggle");
const clock = document.getElementById("clock");

const savedDisplay = localStorage.getItem("clockDisplay");
if (savedDisplay) {
  clock.style.display = savedDisplay;
  displayToggle.checked = savedDisplay === "block";
}

displayToggle.addEventListener("change", () => {
  clock.style.display = displayToggle.checked ? "block" : "none";
  localStorage.setItem("clockDisplay", clock.style.display);
});

const fontFamilySelect = document.getElementById("font-family");

const savedFontFamily = localStorage.getItem("clockFontFamily");
if (savedFontFamily) {
  clock.style.fontFamily = savedFontFamily;
  fontFamilySelect.value = savedFontFamily;
}

fontFamilySelect.addEventListener("change", () => {
  clock.style.fontFamily = fontFamilySelect.value;
  localStorage.setItem("clockFontFamily", fontFamilySelect.value);
});
loadDisplayState();
loadClockSettings();

const wrap = document.querySelector('.wrap');

// Load saved position from localStorage
const savedPosition = JSON.parse(localStorage.getItem('wrapPosition'));
if (savedPosition) {
    wrap.style.left = savedPosition.left;
    wrap.style.top = savedPosition.top;
}

const grabCont = document.querySelector('.player-top');
let isDragging = false;
let offset = { x: 0, y: 0 };

grabCont.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Перетягування лише лівою кнопкою миші
    const playerTop = e.target.closest('.player-top');
    if (playerTop) {
        isDragging = true;
        const rect = wrap.getBoundingClientRect();
        offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        grabCont.style.cursor = 'grabbing';
    }
    e.preventDefault();
});

grabCont.addEventListener('dblclick', () => {
    const bodyRect = document.body.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    const centerX = (bodyRect.width - wrapRect.width) / 2;
    const centerY = (bodyRect.height - wrapRect.height) / 2;

    wrap.style.left = `${centerX}px`;
    wrap.style.top = `${centerY}px`;

    localStorage.setItem('wrapPosition', JSON.stringify({
        left: wrap.style.left,
        top: wrap.style.top,
    }));
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        grabCont.style.cursor = 'grab';
        isDragging = false;
        // Save the current position to localStorage
        localStorage.setItem('wrapPosition', JSON.stringify({
            left: wrap.style.left,
            top: wrap.style.top,
        }));
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let newX = e.clientX - offset.x;
        let newY = e.clientY - offset.y;

        // Ensure the player stays within the boundaries of the body
        const bodyRect = document.body.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();

        // Обмеження на позицію для уникнення виходу за межі body
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + wrapRect.width > bodyRect.width) newX = bodyRect.width - wrapRect.width;
        if (newY + wrapRect.height > bodyRect.height) newY = bodyRect.height - wrapRect.height;

        wrap.style.left = `${newX}px`;
        wrap.style.top = `${newY}px`;
    }
});


// Load saved position from localStorage
const savedClockPosition = JSON.parse(localStorage.getItem('clockPosition'));
if (savedClockPosition) {
    clock.style.position = 'absolute'; // Set position to absolute for manual movement
    clock.style.left = savedClockPosition.left;
    clock.style.top = savedClockPosition.top;
}

let isClockDragging = false;
let clockOffset = { x: 0, y: 0 };

clock.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only allow dragging with left mouse button
    if (e.target.closest('.clock')) {
        isClockDragging = true;
        const rect = clock.getBoundingClientRect();
        clockOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        clock.style.cursor = 'grabbing';
    }
    e.preventDefault();
});

document.addEventListener('mouseup', () => {
    if (isClockDragging) {
        clock.style.cursor = 'grab';
        isClockDragging = false;
        // Save the current position to localStorage
        localStorage.setItem('clockPosition', JSON.stringify({
            left: clock.style.left,
            top: clock.style.top,
        }));
    }
});

document.addEventListener('mousemove', (e) => {
    if (isClockDragging) {
        let newX = e.clientX - clockOffset.x;
        let newY = e.clientY - clockOffset.y;

        // Ensure the clock stays within the boundaries of the body
        const bodyRect = document.body.getBoundingClientRect();
        const clockRect = clock.getBoundingClientRect();

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + clockRect.width > bodyRect.width) newX = bodyRect.width - clockRect.width;
        if (newY + clockRect.height > bodyRect.height) newY = bodyRect.height - clockRect.height;

        clock.style.left = `${newX}px`;
        clock.style.top = `${newY}px`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedPosition = JSON.parse(localStorage.getItem('wrapPosition'));
    if (savedPosition) {
        wrap.style.left = savedPosition.left;
        wrap.style.top = savedPosition.top;
    }

    const savedColor = localStorage.getItem('volumeBarColor');
    const volumeBarInput = document.getElementById('olumeBar');
    if (savedColor) {
        volumeBarInput.value = savedColor;
        updateVolumeBarColor(savedColor);
    }

    volumeBarInput.addEventListener('input', (e) => {
        const color = e.target.value;
        updateVolumeBarColor(color);
        localStorage.setItem('volumeBarColor', color);
    });
});

function updateVolumeBarColor(color) {
    const styleSheet = document.styleSheets[0];
    let ruleExists = false;

    for (let i = 0; i < styleSheet.cssRules.length; i++) {
        if (styleSheet.cssRules[i].selectorText === 'input[type="range"]::-webkit-slider-thumb') {
            styleSheet.cssRules[i].style.boxShadow = `calc(-1 * var(--slider-width)) 0 0 var(--slider-width) ${color}`;
            ruleExists = true;
            break;
        } 
    }

    if (!ruleExists) {
        styleSheet.insertRule(
            `input[type="range"]::-webkit-slider-thumb { box-shadow: calc(-1 * var(--slider-width)) 0 0 var(--slider-width) ${color}; }`,
            styleSheet.cssRules.length
        );
    }
}

const imageSwitch = document.getElementById('image-display-switch');
const coverImage = document.getElementById('cover-image');
const player = document.querySelector('.player');

const savedImageDisplay = localStorage.getItem('coverImageDisplay');
if (savedImageDisplay) {
    coverImage.style.display = savedImageDisplay;
    imageSwitch.checked = savedImageDisplay === 'block';
    player.style.padding = savedImageDisplay === 'block' ? '90px 0' : '30px 0';
}

imageSwitch.addEventListener('change', () => {
    coverImage.style.display = imageSwitch.checked ? 'block' : 'none';
    localStorage.setItem('coverImageDisplay', coverImage.style.display);
    player.style.padding = imageSwitch.checked ? '90px 0' : '30px 0';
});