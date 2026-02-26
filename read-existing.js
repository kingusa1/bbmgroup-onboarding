// Download the Excel file from Drive and read it locally
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'service-account.json'),
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const fileId = process.env.EXISTING_SHEET_ID;

    console.log('Downloading Excel file...');
    try {
        // Export as CSV (Google can convert on the fly for Excel files)
        // Try exporting each sheet
        const file = await drive.files.get({ fileId, fields: 'id,name,mimeType' });
        console.log('File:', file.data.name);

        // Download as xlsx
        const dest = path.join(__dirname, 'existing-data.xlsx');
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const writeStream = fs.createWriteStream(dest);
        await new Promise((resolve, reject) => {
            response.data.pipe(writeStream);
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });

        console.log('Downloaded to existing-data.xlsx');
        console.log('File size:', fs.statSync(dest).size, 'bytes');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
