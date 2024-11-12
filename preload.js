const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
    savePlaylists: (playlists) => ipcRenderer.invoke('save-playlists', playlists),
    selectAudioFiles: () => ipcRenderer.invoke('select-audio-files')
});
