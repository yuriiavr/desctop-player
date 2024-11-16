const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
    savePlaylists: (playlists) => ipcRenderer.invoke('save-playlists', playlists),
    selectAudioFiles: () => ipcRenderer.invoke('select-audio-files'),
    startDownload: (youtubeUrl) => ipcRenderer.send('start-download', youtubeUrl),
    writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),
    showLoadingModal: () => ipcRenderer.send('show-loading-modal'),
    hideLoadingModal: () => ipcRenderer.send('hide-loading-modal'),
    onShowLoadingModal: (callback) => ipcRenderer.on('show-loading-modal', callback),
    onHideLoadingModal: (callback) => ipcRenderer.on('hide-loading-modal', callback),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', callback),
    chooseChromePath: () => ipcRenderer.invoke("choose-chrome-path"),
    exitApp: () => ipcRenderer.send("exit-app"),
    checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
    loadBackgrounds: () => ipcRenderer.invoke("load-backgrounds"),
    saveSelectedBackground: (selectedBackground) => ipcRenderer.invoke("save-selected-background", selectedBackground),
    selectBackgroundImages: () => ipcRenderer.invoke("select-background-images"),
    deleteBackground: (backgroundPath) => ipcRenderer.invoke("delete-background", backgroundPath)
});  