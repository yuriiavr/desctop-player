const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  clipboard,
  globalShortcut,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const os = require("os");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const net = require("net");

const PIPE_PATH = "\\\\.\\pipe\\electron_voice_player";

let voiceAssistantConnected = false;

puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

let mainWindow;

const settingsPath = path.join(app.getPath("userData"), "settings.json");
let customChromePath = loadCustomChromePath();

let connections = 0; 
const server = net.createServer((socket) => {
  connections += 1;
  console.log("Voice assistant connected to player. Active connections:", connections);

  socket.on("data", (data) => {
    try {
      const command = JSON.parse(data.toString().trim());
      handleVoiceCommand(command.action); 
    } catch (error) {
      console.error("Error parsing command:", error);
    }
  });

  socket.on("end", () => {
    connections -= 1;
    console.log("Voice assistant disconnected. Active connections:", connections);
  });

  socket.on("error", (err) => {
    console.error("Socket error:", err);
  });
});

// Запускаємо сервер на пайпі
server.listen(PIPE_PATH, () => {
  console.log(`Listening on pipe: ${PIPE_PATH}`);
});

// Обробка команд
function handleVoiceCommand(action) {
  console.log("Handling voice command:", action);
  mainWindow.webContents.send("voice-command", { action });
}

function loadCustomChromePath() {
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return settings.customChromePath || null;
  }
  return null;
}

function saveCustomChromePath(path) {
  const settings = fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, "utf8"))
    : {};
  settings.customChromePath = path;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function loadSettings() {
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath));
    settings.backgrounds = Array.isArray(settings.backgrounds)
      ? settings.backgrounds
      : [];
    return settings;
  }
  return { backgrounds: [], selectedBackground: "" };
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

ipcMain.handle("get-window-mode", () => {
  const settings = loadSettings();
  return settings.isFullscreen ? "fullscreen" : "minimized";
});

ipcMain.on("start-window-drag", (event) => {
  const bounds = mainWindow.getBounds();
  event.returnValue = bounds; // Передаємо поточні bounds вікна
});

ipcMain.on("update-window-position", (event, { deltaX, deltaY }) => {
  const bounds = mainWindow.getBounds();
  mainWindow.setBounds({
    x: bounds.x + deltaX,
    y: bounds.y + deltaY,
    width: bounds.width,
    height: bounds.height,
  });
});

ipcMain.on("save-window-position", () => {
  const bounds = mainWindow.getBounds();
  saveSmallWindowPosition(bounds.x, bounds.y);
});

ipcMain.handle("get-window-position", () => {
  const settings = loadSettings();
  return settings.smallWindowPosition || { x: 0, y: 0 };
});

ipcMain.handle("choose-chrome-path", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Chrome Executable", extensions: ["exe"] }],
  });

  if (result.filePaths && result.filePaths[0]) {
    customChromePath = result.filePaths[0];
    saveCustomChromePath(customChromePath);
    return customChromePath;
  }
  return null;
});

ipcMain.handle("loadPlaylists", async () => {
  const filePath = path.join(app.getPath("userData"), "playlists.json");
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }
  return {};
});

ipcMain.handle("savePlaylists", async (event, playlists) => {
  const filePath = path.join(app.getPath("userData"), "playlists.json");
  fs.writeFileSync(filePath, JSON.stringify(playlists, null, 2));
});

app.on("ready", () => {
  const settings = loadSettings();
  const isFullscreen = settings.isFullscreen;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.size;

  const smallWindowPosition = settings.smallWindowPosition || { x: 0, y: 0 };

  mainWindow = new BrowserWindow({
    width: isFullscreen ? screenWidth : 500,
    height: isFullscreen ? screenHeight : 280,
    x: isFullscreen ? 0 : smallWindowPosition.x,
    y: isFullscreen ? 0 : smallWindowPosition.y,
    fullscreen: isFullscreen,
    frame: false,
    resizable: false,
    icon: path.join(__dirname, "img", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
      enableRemoteModule: false,
      webSecurity: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.webContents.send("app-ready", isFullscreen);
  });

  mainWindow.webContents.setZoomFactor(1); 
  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key === '+' || input.key === '-' || input.key === '0')) {
      event.preventDefault();
    }
  });

  function registerHotkey() {
    globalShortcut.register("Ctrl+F", () => {
      toggleFullscreen();
    });
    globalShortcut.register("F11", () => {
      toggleFullscreen();
    });

    globalShortcut.register("CommandOrControl+R", () => {
      console.log("Reload is disabled.");
    });
  
    globalShortcut.register("CommandOrControl+Shift+I", () => {
      console.log("DevTools are disabled.");
    });
  }

  function unregisterHotkey() {
    globalShortcut.unregister("Ctrl+F");
    globalShortcut.unregister("F11");
    globalShortcut.unregister("CommandOrControl+Shift+I")
    globalShortcut.unregister("CommandOrControl+R")
  }

  function toggleFullscreen() {
    const isCurrentlyFullscreen = mainWindow.isFullScreen();
    const currentScreen = screen.getDisplayMatching(mainWindow.getBounds());
    const { x, y, width, height } = currentScreen.bounds;

    if (isCurrentlyFullscreen) {
      // Вихід із повноекранного режиму
      mainWindow.setFullScreen(false);

      const smallWindowPosition = getSmallWindowPosition();
      mainWindow.setBounds({
        width: 500,
        height: 280,
        x: smallWindowPosition.x,
        y: smallWindowPosition.y,
      });

      saveWindowSettings(false);
      mainWindow.webContents.send("fullscreen-mode", false);
    } else {
      const bounds = mainWindow.getBounds();

      saveSmallWindowPosition(bounds.x, bounds.y);

      mainWindow.setBounds({
        x: x,
        y: y,
        width: width,
        height: height,
      });
      mainWindow.setFullScreen(true);
      saveWindowSettings(true);
      mainWindow.webContents.send("fullscreen-mode", true);
    }
  }

  mainWindow.on("focus", () => {
    registerHotkey();
  });

  mainWindow.on("blur", () => {
    unregisterHotkey();
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.key.toLowerCase() === "r") {
      event.preventDefault();
    }
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      event.preventDefault();
    }
  });
});

function saveFullscreenScreen(screenBounds) {
  const settings = loadSettings();
  settings.fullscreenScreen = screenBounds;
  saveSettings(settings);
}

function saveSmallWindowPosition(x, y) {
  const settings = loadSettings();
  settings.smallWindowPosition = { x, y };
  saveSettings(settings);
}

function getSmallWindowPosition() {
  const settings = loadSettings();
  return settings.smallWindowPosition || { x: 0, y: 0 };
}

function saveWindowSettings(isFullscreen) {
  const settings = loadSettings();
  settings.isFullscreen = isFullscreen;
  saveSettings(settings);
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();

  if (fs.existsSync(PIPE_PATH)) {
    try {
      fs.unlinkSync(PIPE_PATH);
      console.log(`Pipe ${PIPE_PATH} successfully unlinked.`);
    } catch (error) {
      console.error(`Failed to unlink pipe ${PIPE_PATH}:`, error);
    }
  } else {
    console.log(`Pipe ${PIPE_PATH} does not exist. Skipping unlink.`);
  }
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("load-playlists", async () => {
  const filePath = path.join(app.getPath("userData"), "playlists.json");
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return JSON.parse(data);
  }
  return {};
});

ipcMain.handle("save-playlists", async (event, playlists) => {
  const filePath = path.join(app.getPath("userData"), "playlists.json");
  fs.writeFileSync(filePath, JSON.stringify(playlists, null, 2));
});

ipcMain.handle("select-audio-files", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "Audio Files", extensions: ["mp3", "wav", "flac", "ogg"] },
    ],
  });

  if (result.canceled) {
    return [];
  } else {
    return result.filePaths;
  }
});

ipcMain.handle("check-file-exists", (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.on("start-download", async (event, youtubeUrl) => {
  mainWindow.webContents.send("show-loading-modal");

  (async () => {
    try {
      mainWindow.webContents.send("update-progress", {
        stage: "Initializing",
        progress: 5,
      });
      clipboard.writeText(youtubeUrl);

      const browser = await puppeteer.launch({
        headless: true,
        slowMo: 5,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--window-size=1920,1080",
        ],
        defaultViewport: null,
        executablePath: customChromePath || undefined,
      });

      mainWindow.webContents.send("update-progress", {
        stage: "Launching Browser",
        progress: 20,
      });

      const page = await browser.newPage();

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
      );

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
        Object.defineProperty(window, "self", {
          get: () => window.top,
        });
        window.alert = () => {};
        window.confirm = () => true;
        window.prompt = () => "";
      });

      const downloadPath = path.join(os.homedir(), "Downloads");
      mainWindow.webContents.send("update-progress", {
        stage: "Setting Download Path",
        progress: 30,
      });

      browser.on("targetcreated", async (target) => {
        if (target.type() === "page") {
          const newPage = await target.page();
          await newPage.close();
        }
      });

      mainWindow.webContents.send("update-progress", {
        stage: "Navigating to Download Page",
        progress: 40,
      });
      await page.goto(
        "https://y2meta.app/en/youtube-to-mp3/uIKWMoqYPIU"
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const dialogElement = await page.$('div[role="dialog"]');

      if (dialogElement) {
        const closeButton = await dialogElement.$("button.fc-close");
        if (closeButton) {
          await closeButton.click();
        }
      }

      mainWindow.webContents.send("update-progress", {
        stage: "Searching...",
        progress: 50,
      });
      await page.waitForSelector('input#txt-url');
      await page.focus('input#txt-url');
      await page.type('input#txt-url', youtubeUrl);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.click("#btn-submit");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.click("#process_mp3");
      mainWindow.webContents.send("update-progress", {
        stage: "Download is starting",
        progress: 60,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.click('a[type="button"].btn-success.btn-download-link');

      mainWindow.webContents.send("update-progress", {
        stage: "Checking Download",
        progress: 90,
      });
      const checkFileDownloaded = () => {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            if (fs.existsSync(path.join(downloadPath))) {
              clearInterval(interval);
              resolve(true);
            }
          }, 1000);
        });
      };

      await checkFileDownloaded(downloadPath);
      mainWindow.webContents.send("update-progress", {
        stage: "Download Complete",
        progress: 100,
      });

      dialog.showMessageBoxSync({
        message:
          "You may close this window ONLY when the MP3 file is in the Downloads folder.",
      });

      await browser.close();
    } catch (error) {
      console.error("Error during download:", error);
      dialog.showMessageBoxSync({
        message: `Error during download: ${error.message}`,
      });
    } finally {
      if (mainWindow) {
        mainWindow.webContents.send("hide-loading-modal");
      }
    }
  })();
});

ipcMain.on("exit-app", () => {
  app.quit();
});

ipcMain.handle("select-background-images", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }],
  });
  if (!canceled && filePaths.length > 0) {
    let settings = loadSettings();
    if (!Array.isArray(settings.backgrounds)) {
      settings.backgrounds = [];
    }
    settings.backgrounds.push(...filePaths);
    saveSettings(settings);
    return settings;
  }
  return null;
});

ipcMain.handle("load-backgrounds", () => {
  const settings = loadSettings();
  return settings;
});

ipcMain.handle("save-selected-background", (event, selectedBackground) => {
  const settings = loadSettings();
  settings.selectedBackground = selectedBackground;
  saveSettings(settings);
  return settings;
});

ipcMain.handle("delete-background", (event, backgroundPath) => {
  let settings = loadSettings();
  const normalizedPath = backgroundPath.replace(/\\/g, "/");
  settings.backgrounds = settings.backgrounds.filter(
    (bg) => bg.replace(/\\/g, "/") !== normalizedPath
  );
  if (settings.selectedBackground.replace(/\\/g, "/") === normalizedPath) {
    settings.selectedBackground = "";
  }
  saveSettings(settings);
  return settings;
});

ipcMain.handle("get-metadata", async (event, filePath) => {
  try {
    const tags = NodeID3.read(filePath);
    if (tags) {
      const metadata = {
        title: tags.title || "Unknown Title",
        artist: tags.artist || "Unknown Artist",
        image: tags.image ? tags.image : null,
      };
      return metadata;
    }
    return null;
  } catch (error) {
    console.error(`Failed to read metadata from ${filePath}:`, error);
    return null;
  }
});
