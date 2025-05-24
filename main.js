const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs'); // Import fs module
const { Readable } = require('stream'); // Import Readable from stream module
// const { Blob } = require('buffer'); // No longer needed

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Abrir DevTools para debugging
  win.webContents.openDevTools();

  win.loadFile('renderer/index.html');
}

app.whenReady().then(createWindow);

// Handle key generation request
ipcMain.handle('fetch-data', async (event, url) => {
  try {
    console.log('Fetching from URL:', url); // Para debugging
    const response = await axios.get(url);
    console.log('Response data:', response.data); // Para debugging
    return response.data;
  } catch (err) {
    console.error('Error in fetch-data:', err); // Para debugging
    // Improved error handling to get more details
    throw new Error(err.response?.data?.message || err.message || JSON.stringify(err.response?.data));
  }
});

// Handle file processing (encrypt/decrypt)
ipcMain.handle('process-file', async (event, url, fileArrayBuffer, fileName, fileType, key) => {
  try {
    const formData = new FormData();
    // Convert ArrayBuffer to Buffer in the main process
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    console.log('Processing file buffer:', { fileName, fileType, bufferLength: fileBuffer.length }); // Para debugging

    // Create a readable stream from the buffer
    const fileStream = new Readable();
    fileStream.push(fileBuffer);
    fileStream.push(null); // Indicate end of stream

    // Ensure options object is explicitly created and passed
    const fileOptions = {
        filename: fileName,
        contentType: fileType
    };

    console.log('Appending stream to FormData with options:', fileOptions); // Para debugging

    // Append the stream to FormData.
    formData.append('file', fileStream, fileOptions);
    const keyFieldName = url.includes('encrypt') ? 'publicKey' : 'privateKey';
    formData.append(keyFieldName, key);


    console.log('Sending file stream to backend...', { url, fileName, fileType, keyPresent: !!key }); // Para debugging

    const response = await axios.post(url, formData, {
      responseType: 'arraybuffer',
      headers: {
        ...formData.getHeaders()
      }
    });
    console.log('File processed successfully.', response.status); // Para debugging
    return response.data;
  } catch (err) {
    console.error('Error in process-file:', err); // Para debugging
    // Improved error handling to get more details
    throw new Error(err.response?.data?.message || err.message || JSON.stringify(err.response?.data));
  }
});
