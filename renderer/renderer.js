document.addEventListener('DOMContentLoaded', () => {
    // Key Generation
    document.getElementById('generateKeysBtn').addEventListener('click', async () => {
        try {
            const result = await window.apiBridge.fetchData('https://javacifrator-production.up.railway.app/api/crypto/generate-keys');
            console.log('Response:', result); // Para debugging
            if (result && result.publicKey && result.privateKey) {
                document.getElementById('publicKeyDisplay').textContent = result.publicKey;
                document.getElementById('privateKeyDisplay').textContent = result.privateKey;
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error:', error); // Para debugging
            alert('Error generating keys: ' + error.message);
        }
    });

    // Copy buttons functionality
    document.getElementById('copyPublicKey').addEventListener('click', () => {
        copyToClipboard('publicKeyDisplay');
    });

    document.getElementById('copyPrivateKey').addEventListener('click', () => {
        copyToClipboard('privateKeyDisplay');
    });

    function copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        if (text === 'No key generated yet') {
            alert('No key to copy!');
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => alert('Copied to clipboard!'))
            .catch(err => alert('Failed to copy: ' + err));
    }

    // Download buttons functionality
    document.getElementById('downloadPublicKey').addEventListener('click', () => {
        downloadKey('publicKeyDisplay', 'public_key.txt');
    });

    document.getElementById('downloadPrivateKey').addEventListener('click', () => {
        downloadKey('privateKeyDisplay', 'private_key.txt');
    });

    function downloadKey(elementId, filename) {
        const text = document.getElementById(elementId).textContent;
        if (text === 'No key generated yet') {
            alert('No key to download!');
            return;
        }
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Operation toggle functionality
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const keyInput = document.getElementById('keyInput');

    function setOperation(isDecrypt) {
        encryptBtn.classList.toggle('active', !isDecrypt);
        decryptBtn.classList.toggle('active', isDecrypt);
        keyInput.placeholder = isDecrypt ? 
            'Enter private key for decryption' : 
            'Enter public key for encryption';
    }

    encryptBtn.addEventListener('click', () => setOperation(false));
    decryptBtn.addEventListener('click', () => setOperation(true));

    // File input functionality
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.querySelector('.file-name');
    const clearFileBtn = document.querySelector('.clear-file');

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        fileNameDisplay.firstChild.textContent = file ? file.name : 'No file chosen';
    });

    clearFileBtn.addEventListener('click', () => {
        fileInput.value = '';
        fileNameDisplay.firstChild.textContent = 'No file chosen';
    });

    // File processing
    document.getElementById('processFileBtn').addEventListener('click', async () => {
        const file = fileInput.files[0];
        const key = keyInput.value.trim();
        const isDecrypt = decryptBtn.classList.contains('active');

        if (!file) {
            alert('Please select a file first!');
            return;
        }

        if (!key) {
            alert('Please enter the required key!');
            return;
        }

        try {
            // Read file content as ArrayBuffer
            const fileContent = await file.arrayBuffer();
            // Send ArrayBuffer, fileName, fileType and key to main process
            const endpoint = isDecrypt ? 
                'https://javacifrator-production.up.railway.app/api/crypto/decrypt' : 
                'https://javacifrator-production.up.railway.app/api/crypto/encrypt';

            // Corrected order of arguments: url, fileArrayBuffer, fileName, fileType, key
            const response = await window.apiBridge.processFile(endpoint, fileContent, file.name, file.type, key);
            // Create download link for the processed file
            const blob = new Blob([response], { 
                type: isDecrypt ? file.type : 'application/octet-stream' 
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = isDecrypt ? file.name : file.name + '.bin';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error processing file:', error); // Para debugging
            alert('Error processing file: ' + error.message);
        }
    });
});
  