const { app, BrowserWindow, ipcMain, dialog, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const os = require("os");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    icon: path.join(__dirname, "img", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
      enableRemoteModule: false,
    },
    autoHideMenuBar: true,
  });
  mainWindow.loadFile("index.html");
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
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Audio Files", extensions: ["mp3", "wav", "ogg"] }],
  });
  return result.filePaths;
});

ipcMain.on("start-download", async (event, youtubeUrl) => {
    mainWindow.webContents.send("show-loading-modal");
  
    (async () => {
      try {
        mainWindow.webContents.send("update-progress", { stage: "Initializing", progress: 5 });
        console.log("Received YouTube URL:", youtubeUrl);
        clipboard.writeText(youtubeUrl);
  
        console.log("Launching Puppeteer browser...");
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
        });
  
        mainWindow.webContents.send("update-progress", { stage: "Launching Browser", progress: 20 });
  
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
        mainWindow.webContents.send("update-progress", { stage: "Setting Download Path", progress: 30 });
        console.log("Download path set to:", downloadPath);
  
        browser.on("targetcreated", async (target) => {
          if (target.type() === "page") {
            const newPage = await target.page();
            console.log("New tab detected, closing it...");
            await newPage.close();
          }
        });
  
        mainWindow.webContents.send("update-progress", { stage: "Navigating to Download Page", progress: 40 });
        await page.goto("https://ytshorts.savetube.me/14-youtube-music-downloader-2eree3?id=497895709");
        await new Promise((resolve) => setTimeout(resolve, 1000));
  
        const dialogElement = await page.$('div[role="dialog"]');
  
        if (dialogElement) {
          const closeButton = await dialogElement.$('button.fc-close');
          if (closeButton) {
            await closeButton.click();
          }
        }
  
        mainWindow.webContents.send("update-progress", { stage: "Filling in Search Field", progress: 50 });
        await page.waitForSelector('input[type="search"]');
        await page.focus('input[type="search"]');
        await page.type('input[type="search"]', youtubeUrl);
        await new Promise((resolve) => setTimeout(resolve, 1000));
  
        mainWindow.webContents.send("update-progress", { stage: "Getting Link", progress: 60 });
        await page.waitForSelector('#downloadSection');
        await page.waitForSelector("#downloadSection button", { timeout: 60000 });
        await page.click("#downloadSection button");
        await new Promise((resolve) => setTimeout(resolve, 1000));
  
        mainWindow.webContents.send("update-progress", { stage: "Clicking Download", progress: 70 });
        await page.waitForSelector("a[download]", { timeout: 60000 });
        await page.click("a[download]");
  
        mainWindow.webContents.send("update-progress", { stage: "Checking Download", progress: 80 });
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
        mainWindow.webContents.send("update-progress", { stage: "Download Complete", progress: 100 });
        console.log("File downloaded successfully.");

        dialog.showMessageBoxSync({
          message: "You may close this window once the MP3 file is in the Downloads folder.",
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
  