// Update Google Sheet: rename to BBM Group and update Onboarding Submissions headers
require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, 'service-account.json'),
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
        ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });
    const spreadsheetId = process.env.MAIN_SHEET_ID;

    // 1. Rename spreadsheet
    console.log('1. Renaming spreadsheet to BBM Group...');
    await drive.files.update({
        fileId: spreadsheetId,
        requestBody: { name: 'BBM Group - Onboarding System' },
    });
    console.log('   Done: "BBM Group - Onboarding System"');

    // 2. Update Onboarding Submissions headers (removed content posting columns)
    console.log('2. Updating Onboarding Submissions headers...');
    const onboardingHeaders = [
        'Timestamp', 'Full Name', 'Email', 'Phone', 'Company', 'Job Title',
        'Website', 'Referral Source', 'LinkedIn URL', 'LinkedIn Email',
        'LinkedIn Password', 'Account Age', 'Connection Count',
        'Account Classification', '2FA Method', '2FA Contact',
        'Account Status', 'Primary Goal', 'Audience Category',
        'Ethnic Community', 'Ethnic Geographic', 'Language Preferences',
        'Religious Affiliation', 'Community Orgs', 'Primary Industry',
        'Secondary Industry', 'Industry Keywords', 'Niche Specialization',
        'Target Job Titles', 'Geographic Focus', 'Company Size Preference',
        'Seniority Level', 'Current Headline', 'Current About',
        'Key Accomplishments', 'Value Proposition', 'Profile Assets',
        'Recommendation Count', 'Licenses', 'Profile Notes',
        'Weekend Activity', 'Working Hours', 'BBM Messaging Approval',
        'Campaign Notes', 'Agree Terms',
        'Signature Name', 'Signature Date', 'Status'
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Onboarding Submissions!A1',
        valueInputOption: 'RAW',
        resource: { values: [onboardingHeaders] },
    });
    console.log('   Headers updated (removed content posting columns)');

    console.log('\nDone! Sheet updated at:');
    console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}

main().catch(console.error);
