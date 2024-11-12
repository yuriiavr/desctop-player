const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1900,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
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
