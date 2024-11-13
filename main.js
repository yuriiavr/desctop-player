const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const os = require('os'); 
puppeteer.use(AdblockerPlugin());

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1900,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: true,
            enableRemoteModule: false,
        }
    });
    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
});

ipcMain.handle('load-playlists', async () => {
    const filePath = path.join(app.getPath('userData'), 'playlists.json');
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
    }
    return {};
});

ipcMain.handle('save-playlists', async (event, playlists) => {
    const filePath = path.join(app.getPath('userData'), 'playlists.json');
    fs.writeFileSync(filePath, JSON.stringify(playlists, null, 2));
});


ipcMain.handle('select-audio-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }]
    });
    return result.filePaths;
});

ipcMain.on('start-download', async (event, youtubeUrl) => {

    mainWindow.webContents.send('show-loading-modal');

    try {
        // Показуємо модальне вікно, коли починається завантаження
        event.sender.send('show-loading-modal');

        console.log("Received YouTube URL:", youtubeUrl);

        // Перевірка та заміна частини посилання
        if (youtubeUrl.startsWith('https://www.youtube.com/')) {
            youtubeUrl = youtubeUrl.replace('https://www.youtube.com/', 'https://www.youtubezz.com/');
            console.log("Modified URL:", youtubeUrl);
        } else {
            console.error("Invalid YouTube URL. Skipping download.");
            return;
        }

        console.log("Launching Puppeteer browser...");
        const browser = await puppeteer.launch({
            headless: true,
            slowMo: 250,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null
        });

        console.log("Opening new page...");
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36');
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Встановлення директорії для завантажень
        const downloadPath = path.join(os.homedir(), 'Downloads');
        console.log("Download path set to:", downloadPath);

        // Переходимо за новим посиланням
        await page.goto(youtubeUrl);

        // Затримка для завантаження сторінки
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Натискання на посилання "mp3"
        await page.waitForSelector('a[href="#mp3"]', { timeout: 60000 });
        await page.click('a[href="#mp3"]');

        // Затримка 2 секунди перед натисканням на кнопку якості
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Натискання на кнопку "320 kbps"
        await page.waitForSelector('button[data-fquality="320"]', { timeout: 60000 });
        await page.click('button[data-fquality="320"]');

        // Затримка перед пошуком посилання для завантаження
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Знаходимо посилання на завантаження
        await page.waitForSelector('.form-group.has-success.has-feedback .btn.btn-success.btn-download-link', { timeout: 60000 });
        const downloadLinkElement = await page.$('.form-group.has-success.has-feedback .btn.btn-success.btn-download-link');

        // Натискаємо на перше посилання завантаження, якщо воно знайдене
        if (downloadLinkElement) {
            await downloadLinkElement.click();
        } else {
            console.error('Download link element not found!');
            return;
        }

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

        // Очікуємо завершення завантаження
        await checkFileDownloaded(downloadPath);
        console.log("File downloaded successfully.");

        await new Promise(resolve => setTimeout(resolve, 5000));
        dialog.showMessageBoxSync({ message: 'You may close this window once the MP3 file is in the Downloads folder.' });

        // Закриваємо браузер
        await browser.close();
    } catch (error) {
        console.error('Error during download:', error);
        dialog.showMessageBoxSync({ message: `Error during download: ${error.message}` });
    } finally {
        // Приховуємо модальне вікно після завершення завантаження або помилки
        mainWindow.webContents.send('hide-loading-modal');
    }
});
