const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiBridge', {
  fetchData: async (url) => await ipcRenderer.invoke('fetch-data', url),
  processFile: async (url, fileArrayBuffer, fileName, fileType, key) => 
    await ipcRenderer.invoke('process-file', url, fileArrayBuffer, fileName, fileType, key)
});