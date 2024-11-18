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

puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

let mainWindow;

const settingsPath = path.join(app.getPath("userData"), "settings.json");
let customChromePath = loadCustomChromePath();

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

  globalShortcut.register("Ctrl+M", () => {
    toggleFullscreen();
  });

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
      // Вхід у повноекранний режим
      const bounds = mainWindow.getBounds();

      // Зберігаємо поточну позицію вікна перед переходом
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
});

function saveFullscreenScreen(screenBounds) {
  const settings = loadSettings();
  settings.fullscreenScreen = screenBounds; // Збереження bounds екрану
  saveSettings(settings);
}

function saveSmallWindowPosition(x, y) {
  const settings = loadSettings();
  settings.smallWindowPosition = { x, y }; // Позиція вікна
  saveSettings(settings);
}

function getSmallWindowPosition() {
  const settings = loadSettings();
  return settings.smallWindowPosition || { x: 0, y: 0 }; // Позиція за замовчуванням
}

function saveWindowSettings(isFullscreen) {
  const settings = loadSettings();
  settings.isFullscreen = isFullscreen;
  saveSettings(settings);
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
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
        "https://ytshorts.savetube.me/14-youtube-music-downloader-2eree3?id=497895709"
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
      await page.waitForSelector('input[type="search"]');
      await page.focus('input[type="search"]');
      await page.type('input[type="search"]', youtubeUrl);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      mainWindow.webContents.send("update-progress", {
        stage: "Getting Link",
        progress: 60,
      });
      await page.waitForSelector("#downloadSection");
      await page.waitForSelector("#downloadSection button", { timeout: 60000 });
      await page.click("#downloadSection button");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      mainWindow.webContents.send("update-progress", {
        stage: "Download is starting",
        progress: 70,
      });
      await page.waitForSelector("a[download]", { timeout: 60000 });
      await page.click("a[download]");

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
          "You may close this window once the MP3 file is in the Downloads folder.",
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
