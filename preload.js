const { contextBridge, ipcRenderer } = require('electron');
const NodeID3 = require('node-id3');

contextBridge.exposeInMainWorld('electronAPI', {
    getMetadata: (filePath) => {
        try {
          const tags = NodeID3.read(filePath);
          console.log("ID3 Tags retrieved:", tags);
          if (tags && tags.image) {
            return {
              ...tags,
              image: {
                mime: tags.image.mime,
                data: tags.image.imageBuffer
              }
            };
          }
          return tags;
        } catch (error) { 
          console.error("Failed to parse ID3 tags:", error);
          return null;
        }
    },      
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
    deleteBackground: (backgroundPath) => ipcRenderer.invoke("delete-background", backgroundPath),
    onAppReady: (callback) => {
        ipcRenderer.on('app-ready', callback);
    },
    showMainWindow: () => {
        ipcRenderer.send('show-main-window');
    }
});  