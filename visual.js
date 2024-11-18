const openListBtn = document.getElementById("playlist-btn");
const openDownloadBtn = document.getElementById("ytdownload");
const openSettingsBtn = document.getElementById("settings");

const openListWrap = document.getElementById("playlist-wrap");
const openMiniPlaylist = document.getElementById("playlistMini")
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

openMiniPlaylist.addEventListener("click", function() {
  openListWrap.style.display = "flex"
})

openListBtn.addEventListener("click", function () {
  toggleExclusive(openListWrap, openDownloadWrap, openSettingsWrap);
});

openDownloadBtn.addEventListener("click", function () {
  toggleExclusive(openDownloadWrap, openListWrap, openSettingsWrap);
});

openSettingsBtn.addEventListener("click", function () {
  toggleExclusive(openSettingsWrap, openListWrap, openDownloadWrap);
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    openListWrap.style.display = "none";
    openDownloadWrap.style.display = "none";
    openSettingsWrap.style.display = "none";

    saveDisplayState();
  }
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

function saveClockSettings() {
  const clockSettings = {
    fontSize: fontSizeInput.value,
    gradientStart: gradientStartInput.value,
    gradientEnd: gradientEndInput.value,
  };
  localStorage.setItem("clockSettings", JSON.stringify(clockSettings));
}

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

const basicFontFamilySelect = document.getElementById("basic-font-family");
const savedbasicFontFamily = localStorage.getItem("basicFontFamily");
if (savedbasicFontFamily) {
  document.body.style.fontFamily = savedbasicFontFamily;
  basicFontFamilySelect.value = savedbasicFontFamily;
}

basicFontFamilySelect.addEventListener("change", () => {
  document.body.style.fontFamily = basicFontFamilySelect.value;
  localStorage.setItem("basicFontFamily", basicFontFamilySelect.value);
});
loadDisplayState();
loadClockSettings();

  
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.querySelector(".wrap");

  // Завантажуємо позицію wrap
  const savedWrapPosition = JSON.parse(localStorage.getItem("wrapPosition"));
  if (savedWrapPosition) {
    wrap.style.left = savedWrapPosition.left;
    wrap.style.top = savedWrapPosition.top;
  }

  const grabCont = document.querySelector(".player-top");
  let isDraggingWrap = false; // Відслідковуємо тільки wrap
  let offset = { x: 0, y: 0 };

  // Початок перетягування wrap
  grabCont.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;

    const playerTop = e.target.closest(".player-top");
    if (playerTop) {
      isDraggingWrap = true; // Відмічаємо, що перетягуємо wrap
      const rect = wrap.getBoundingClientRect();
      offset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      grabCont.style.cursor = "grabbing";
    }
    e.preventDefault();
  });

  // Завершення перетягування wrap
  document.addEventListener("mouseup", () => {
    if (isDraggingWrap) {
      grabCont.style.cursor = "grab";
      isDraggingWrap = false;

      // Зберігаємо позицію wrap
      localStorage.setItem(
        "wrapPosition",
        JSON.stringify({
          left: wrap.style.left,
          top: wrap.style.top,
        })
      );
    }
  });

  // Перетягування wrap
  document.addEventListener("mousemove", (e) => {
    if (isDraggingWrap) {
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      const bodyRect = document.body.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();

      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX + wrapRect.width > bodyRect.width)
        newX = bodyRect.width - wrapRect.width;
      if (newY + wrapRect.height > bodyRect.height)
        newY = bodyRect.height - wrapRect.height;

      wrap.style.left = `${newX}px`;
      wrap.style.top = `${newY}px`;
    }
  });
});


const savedClockPosition = JSON.parse(localStorage.getItem("clockPosition"));
if (savedClockPosition) {
  clock.style.position = "absolute";
  clock.style.left = savedClockPosition.left;
  clock.style.top = savedClockPosition.top;
}

let isClockDragging = false;
let clockOffset = { x: 0, y: 0 };

clock.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  if (e.target.closest(".clock")) {
    isClockDragging = true;
    const rect = clock.getBoundingClientRect();
    clockOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    clock.style.cursor = "grabbing";
  }
  e.preventDefault();
});

document.addEventListener("mouseup", () => {
  if (isClockDragging) {
    clock.style.cursor = "grab";
    isClockDragging = false;
    localStorage.setItem(
      "clockPosition",
      JSON.stringify({
        left: clock.style.left,
        top: clock.style.top,
      })
    );
  }
});

document.addEventListener("mousemove", (e) => {
  if (isClockDragging) {
    let newX = e.clientX - clockOffset.x;
    let newY = e.clientY - clockOffset.y;

    const bodyRect = document.body.getBoundingClientRect();
    const clockRect = clock.getBoundingClientRect();

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + clockRect.width > bodyRect.width)
      newX = bodyRect.width - clockRect.width;
    if (newY + clockRect.height > bodyRect.height)
      newY = bodyRect.height - clockRect.height;

    clock.style.left = `${newX}px`;
    clock.style.top = `${newY}px`;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const mainFunctions = document.querySelector(".main-functions");
  const offButton = document.getElementById("off-btn");
  const dragBar = document.getElementById("drag-bar");
  const playerWrapper = document.querySelector(".player");
  const fullPlayerWrapper = document.querySelector(".wrap");
  const settingsWrap = document.getElementById("settings-wrap")
  const downloadWrap = document.getElementById("download-wrap")
  const playlistWrap = document.getElementById("playlist-wrap")
  const wrap = document.querySelector(".wrap");
  const playlistsCont = document.querySelectorAll(".playlist-cont")
  const freeSpace = document.getElementById("space")

  function updateVisibilityBasedOnWindowSize() {
    const isFullscreen = window.outerWidth >= screen.width && window.outerHeight >= screen.height;
  
    if (isFullscreen) {
      if (dragBar) dragBar.style.display = "none";
      if (mainFunctions) mainFunctions.style.display = "flex";
      if (offButton) offButton.style.display = "block";
      if (playerWrapper) playerWrapper.style.borderRadius = "20px";
      playlistsCont.forEach(cont => {
        if (cont) cont.style.display = "flex"
      });
      if (playlistWrap) playlistWrap.style.maxWidth = "600px"
      if (freeSpace) freeSpace.style.display = "flex"
      
  
      const savedPosition = JSON.parse(localStorage.getItem("wrapPosition"));
      if (savedPosition) {
        fullPlayerWrapper.style.left = savedPosition.left;
        fullPlayerWrapper.style.top = savedPosition.top;
      } else {
        const bodyRect = document.body.getBoundingClientRect();
        const wrapRect = fullPlayerWrapper.getBoundingClientRect();
        fullPlayerWrapper.style.left = `${(bodyRect.width - wrapRect.width) / 2}px`;
        fullPlayerWrapper.style.top = `${(bodyRect.height - wrapRect.height) / 2}px`;
      }
    } else {
      if (dragBar) dragBar.style.display = "flex";
      if (mainFunctions) mainFunctions.style.display = "none";
      if (offButton) offButton.style.display = "none";
      if (playerWrapper) playerWrapper.style.borderRadius = "0px";
      fullPlayerWrapper.style.left = "0";
      fullPlayerWrapper.style.top = "0";
      if (settingsWrap) settingsWrap.style.display = "none";
      if (downloadWrap) downloadWrap.style.display = "none";
      if (playlistWrap) playlistWrap.style.display = "none";
      playlistsCont.forEach((cont, index) => {
        if ((index + 1) % 2 === 0) { cont.style.display = "none"}
      });
      if (playlistWrap) playlistWrap.style.maxWidth = "450px"
      if (freeSpace) freeSpace.style.display = "none"
    }
  }

  function updateDisplayBasedOnWindowSize() {
    const isSmallVersion = window.innerWidth <= 500;
  
    if (isSmallVersion) {
      coverImage.style.display = "none";
      imageSwitch.checked = true;
      player.style.padding = "30px 0";
      player.style.width = "500px";
      wrap.style.width = "500px";
  
      const imageSize = "40px";
      playImg.style.width = imageSize;
      controlsImgs.forEach((img) => (img.style.width = imageSize));
      volumeImg.style.display = "none";
    } else {
      const savedImageDisplay = localStorage.getItem("coverImageDisplay");
      coverImage.style.display = savedImageDisplay || "block";
      imageSwitch.checked = savedImageDisplay === "none";
  
      player.style.padding = savedImageDisplay === "none" ? "30px 0" : "90px 0";
      player.style.width = savedImageDisplay === "none" ? "500px" : "600px";
      wrap.style.width = savedImageDisplay === "none" ? "500px" : "600px";
  
      const imageSize = savedImageDisplay === "none" ? "40px" : "50px";
      playImg.style.width = imageSize;
      controlsImgs.forEach((img) => (img.style.width = imageSize));
      volumeImg.style.display = savedImageDisplay === "none" ? "none" : "block";
    }
  }

  window.addEventListener("resize", updateDisplayBasedOnWindowSize);

  updateDisplayBasedOnWindowSize();

  imageSwitch.addEventListener("change", () => {
    if (window.innerWidth > 500) { 
      coverImage.style.display = imageSwitch.checked ? "none" : "block";
      localStorage.setItem("coverImageDisplay", coverImage.style.display);
  
      player.style.padding = imageSwitch.checked ? "30px 0" : "90px 0";
      player.style.width = imageSwitch.checked ? "500px" : "600px";
      wrap.style.width = imageSwitch.checked ? "500px" : "600px";
  
      const imageSize = imageSwitch.checked ? "40px" : "50px";
      playImg.style.width = imageSize;
      controlsImgs.forEach((img) => (img.style.width = imageSize));
      volumeImg.style.display = imageSwitch.checked ? "none" : "block";
    }
  });

  updateVisibilityBasedOnWindowSize();

  window.addEventListener("resize", updateVisibilityBasedOnWindowSize);

  document.addEventListener("keydown", (event) => { 
    if (event.ctrlKey && event.key === "m") {
      window.resizeTo(500, 300);
      setTimeout(updateVisibilityBasedOnWindowSize, 500);
    }
  });

  const savedPosition = JSON.parse(localStorage.getItem("wrapPosition"));
  if (savedPosition) {
    wrap.style.left = savedPosition.left;
    wrap.style.top = savedPosition.top;
  }

  const savedColor = localStorage.getItem("volumeBarColor");
  const volumeBarInput = document.getElementById("olumeBar");
  if (savedColor) {
    volumeBarInput.value = savedColor;
    updateVolumeBarColor(savedColor);
  }

  volumeBarInput.addEventListener("input", (e) => {
    const color = e.target.value;
    updateVolumeBarColor(color);
    localStorage.setItem("volumeBarColor", color);
  });
});

function updateVolumeBarColor(color) {
  const styleSheet = document.styleSheets[0];
  let ruleExistsVolume = false;
  let ruleExistsRepeat = false;

  for (let i = 0; i < styleSheet.cssRules.length; i++) {
    const rule = styleSheet.cssRules[i];

    if (rule.selectorText === 'input[type="range"]::-webkit-slider-thumb') {
      rule.style.boxShadow = `calc(-1 * var(--slider-width)) 0 0 var(--slider-width) ${color}`;
      ruleExistsVolume = true;
    }

    if (rule.selectorText === ".repeat") {
      rule.style.fill = color;
      ruleExistsRepeat = true;
    }
  }

  if (!ruleExistsVolume) {
    styleSheet.insertRule(
      `input[type="range"]::-webkit-slider-thumb { box-shadow: calc(-1 * var(--slider-width)) 0 0 var(--slider-width) ${color}; }`,
      styleSheet.cssRules.length
    );
  }

  if (!ruleExistsRepeat) {
    styleSheet.insertRule(
      `.repeat { fill: ${color}; }`,
      styleSheet.cssRules.length
    );
  }
}

const imageSwitch = document.getElementById("image-display-switch");
const coverImage = document.getElementById("cover-image");
const player = document.querySelector(".player");
const controlsImgs = document.querySelectorAll(".controlls img");
const volumeImg = document.querySelector(".volume img");
const playImg = document.querySelector("#play img");
const wrap = document.querySelector(".wrap");


const savedImageDisplay = localStorage.getItem("coverImageDisplay");
if (savedImageDisplay) {
  coverImage.style.display = savedImageDisplay;
  imageSwitch.checked = savedImageDisplay === "none";
  player.style.padding = savedImageDisplay === "none" ? "30px 0" : "90px 0";
  player.style.width = savedImageDisplay === "none" ? "500px" : "600px";
  wrap.style.width = savedImageDisplay === "none" ? "500px" : "600px";

  const imageSize = savedImageDisplay === "none" ? "40px" : "50px";
  playImg.style.width = imageSize;
  controlsImgs.forEach((img) => (img.style.width = imageSize));
  volumeImg.style.display = savedImageDisplay === "none" ? "none" : "block";
}

imageSwitch.addEventListener("change", () => {
  coverImage.style.display = imageSwitch.checked ? "none" : "block";
  localStorage.setItem("coverImageDisplay", coverImage.style.display);

  player.style.padding = imageSwitch.checked ? "30px 0" : "90px 0";
  player.style.width = imageSwitch.checked ? "500px" : "600px";
  wrap.style.width = imageSwitch.checked ? "500px" : "600px";

  const imageSize = imageSwitch.checked ? "40px" : "50px";
  playImg.style.width = imageSize;
  controlsImgs.forEach((img) => (img.style.width = imageSize));
  volumeImg.style.display = imageSwitch.checked ? "none" : "block";
});

//Settings section

const visualBtn = document.getElementById("visualBtn");
const soundBtn = document.getElementById("soundBtn");
const otherBtn = document.getElementById("otherBtn");
const visualSettings = document.getElementById("visualSettings");
const musicSettings = document.getElementById("musicSettings");
const otherSettings = document.getElementById("otherSettings");

visualBtn.addEventListener("click", () => {
  visualSettings.style.display = "flex";
  musicSettings.style.display = "none";
  otherSettings.style.display = "none";

  visualBtn.classList.add("setting-btn-active");
  soundBtn.classList.remove("setting-btn-active");
  otherBtn.classList.remove("setting-btn-active");
});

soundBtn.addEventListener("click", () => {
  musicSettings.style.display = "flex";
  visualSettings.style.display = "none";
  otherSettings.style.display = "none";

  soundBtn.classList.add("setting-btn-active");
  visualBtn.classList.remove("setting-btn-active");
  otherBtn.classList.remove("setting-btn-active");
});

otherBtn.addEventListener("click", () => {
  musicSettings.style.display = "none";
  visualSettings.style.display = "none";
  otherSettings.style.display = "flex";

  soundBtn.classList.remove("setting-btn-active");
  visualBtn.classList.remove("setting-btn-active");
  otherBtn.classList.add("setting-btn-active");
});

function scrollToActiveSong() {
  const playlist = document.querySelector("#playlist.scrollbar");
  const activeSong = playlist.querySelector(".song-name[style*='font-weight: bold;']");

  if (activeSong) {
    activeSong.scrollIntoView({ behavior: "smooth", block: "center" });
    console.log("Scrolled to active song:", activeSong.textContent);
  }
}

openListBtn.addEventListener("click", function () {
  toggleExclusive(openListWrap, openDownloadWrap, openSettingsWrap);
  scrollToActiveSong();
});

openMiniPlaylist.addEventListener("click", function () {
  openListWrap.style.display = "flex";
  scrollToActiveSong();
});
