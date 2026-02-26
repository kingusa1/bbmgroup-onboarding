// Utility: Read existing sheets to understand structure
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'service-account.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read EXISTING accounts sheet
    console.log('=== EXISTING ACCOUNTS SHEET ===');
    try {
        const existing = await sheets.spreadsheets.get({
            spreadsheetId: process.env.EXISTING_SHEET_ID,
        });
        console.log('Sheet name:', existing.data.properties.title);
        console.log('Tabs:', existing.data.sheets.map(s => s.properties.title));

        // Read first tab data
        for (const sheet of existing.data.sheets) {
            const tabName = sheet.properties.title;
            console.log(`\n--- Tab: "${tabName}" ---`);
            try {
                const data = await sheets.spreadsheets.values.get({
                    spreadsheetId: process.env.EXISTING_SHEET_ID,
                    range: `'${tabName}'!A1:Z50`,
                });
                if (data.data.values) {
                    data.data.values.forEach((row, i) => {
                        console.log(`Row ${i + 1}:`, row.join(' | '));
                    });
                } else {
                    console.log('(empty)');
                }
            } catch (err) {
                console.log('Error reading tab:', err.message);
            }
        }
    } catch (err) {
        console.error('Error reading existing sheet:', err.message);
    }

    // Read MAIN new sheet
    console.log('\n\n=== MAIN NEW SHEET ===');
    try {
        const main = await sheets.spreadsheets.get({
            spreadsheetId: process.env.MAIN_SHEET_ID,
        });
        console.log('Sheet name:', main.data.properties.title);
        console.log('Tabs:', main.data.sheets.map(s => s.properties.title));

        for (const sheet of main.data.sheets) {
            const tabName = sheet.properties.title;
            console.log(`\n--- Tab: "${tabName}" ---`);
            try {
                const data = await sheets.spreadsheets.values.get({
                    spreadsheetId: process.env.MAIN_SHEET_ID,
                    range: `'${tabName}'!A1:Z10`,
                });
                if (data.data.values) {
                    data.data.values.forEach((row, i) => {
                        console.log(`Row ${i + 1}:`, row.join(' | '));
                    });
                } else {
                    console.log('(empty)');
                }
            } catch (err) {
                console.log('Error reading tab:', err.message);
            }
        }
    } catch (err) {
        console.error('Error reading main sheet:', err.message);
    }
}

main();
