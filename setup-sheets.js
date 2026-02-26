// Setup the main Google Sheet with organized tabs and migrate existing data
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

    // 1. Rename the spreadsheet
    console.log('1. Renaming spreadsheet...');
    await drive.files.update({
        fileId: spreadsheetId,
        requestBody: { name: 'Defy Insurance - Onboarding System' },
    });
    console.log('   Done: "Defy Insurance - Onboarding System"');

    // 2. Get current sheets
    const ss = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = ss.data.sheets;
    const sheet1Id = existingSheets[0].properties.sheetId;

    // 3. Rename Sheet1 to "Client Accounts" and add new tabs
    console.log('2. Creating tabs...');
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [
                // Rename Sheet1 to "Client Accounts"
                {
                    updateSheetProperties: {
                        properties: { sheetId: sheet1Id, title: 'Client Accounts' },
                        fields: 'title',
                    },
                },
                // Add "Onboarding Submissions" tab
                { addSheet: { properties: { title: 'Onboarding Submissions' } } },
                // Add "Campaign Tracker" tab
                { addSheet: { properties: { title: 'Campaign Tracker' } } },
            ],
        },
    });
    console.log('   Created: Client Accounts, Onboarding Submissions, Campaign Tracker');

    // 4. Set up "Client Accounts" headers and data
    console.log('3. Setting up Client Accounts...');
    const clientHeaders = [
        'Agent Name', 'Phone Number', 'Date of Birth', 'Email',
        'LinkedIn Email', 'LinkedIn Password', 'Gmail Access',
        'Gmail Password', 'Gmail Recovery', 'Location',
        'Account Type', 'Tier', 'Subscription Level',
        'Verification Status', 'Status', 'Date Added'
    ];

    // Existing agent data (cleaned up from the Excel)
    const existingAgents = [
        ['Mohamed Mounir', '848-459-7177', '', 'cnjinsurance@outlook.com',
         'Mhmounir@hotmail.com', 'Medo1980', 'defymmounir@gmail.com',
         'Defy2024!', 'ramy@defyinsurance.com', 'Manalapan, NJ',
         '', '', '', '', 'Active', ''],
        ['Ramy Sharaf', '732-754-5336', '', 'ramy@defyinsurance.com',
         'ramy@defyinsurance.com', 'Defy2020!', 'defyramy@gmail.com',
         'Defy2024!', 'ramy@defyinsurance.com', 'Holmdel, NJ',
         '', '', '', '', 'Active', ''],
        ['Wissam Elgamal', '732-395-8864', '', '',
         '', '', 'defywissam@gmail.com',
         'Defy2024!', 'ramy@defyinsurance.com', '',
         '', '', '', '', 'Active', ''],
        ['Denzi DeOliveira', '713-829-1656', '6/20/1986', 'deniz@defyinsurance.com',
         'deniz@defyinsurance.com', 'Denizdefy2025!', 'defydeniz@gmail.com',
         'Defy2025!', 'ramy@defyinsurance.com', 'Houston, Texas',
         '', '', '', '', 'Active', ''],
        ['Rifka Mohamed', '713-829-1656', '', 'Rifka@Defyinsurance.com',
         'Rifka@Defyinsurance.com', '0908556295', 'Rifka@Defyinsurance.com',
         'Defy2025!', 'ramy@defyinsurance.com', '',
         '', '', '', '', 'Active', ''],
        ['Monder', '+1 (734) 658-9129', '', 'mshwehdi.tct@gmail.com',
         'm@shwehdi.com', 'Defy2025!', '',
         '', '', '',
         '', '', '', '', 'Active', ''],
        ['Shadi', '', '', 'shadi.munir@gmail.com',
         'shadi.munir@gmail.com', 'Thechamp99', '',
         '', '', '',
         '', '', '', '', 'Active', ''],
        ['Omar', '', '', 'oasisodysseytours@gmail.com',
         'oasisodysseytours@gmail.com', 'Defy2025!', '',
         '', '', '',
         '', '', '', '', 'Active', ''],
        ['Gary Pyatigorsky', '3478854279', '10/10/1979', 'info@netembark.com',
         'info@netembark.com', 'Defy2025!', 'gerydefy2025@gmail.com',
         'Defy2025!', 'ramy@defyinsurance.com', 'Manalapan, NJ',
         '', '', '', '', 'Active', ''],
        ['Ashure Elbanna', '+1 848-365-0935', '', 'ash@gtgcompany.com',
         'ash@gtgcompany.com', 'Defy2025!', 'defygary2026@gmail.com',
         'Defy2026!', 'ramy@defyinsurance.com', '',
         '', '', '', '', 'Active', ''],
        ['Alex Greenberg', '215-498-5109', '', 'agreenberg@vivatinc.com',
         'agreenberg@vivatinc.com', 'hec-A6y-xmd-9eZ', 'AlexGreenberg.Defy@gmail.com',
         'Defy2025!', 'ramy@defyinsurance.com', '',
         '', '', '', '', 'Active', ''],
        ['Edward Telmany', '(646) 479-9592', '4/5/1975', 'telmanyedward@gmail.com',
         'etelmany@uscoachwaysinc.com', 'Limolink789!', 'telmanyedward@gmail.com',
         'Limolink789!', '', 'Holmdel, NJ',
         '', '', '', '', 'Active', ''],
        ['Tarek Mashally', '(732) 485-7392', '12/12/1978', 'T.mashally@gmail.com',
         'T.mashally@gmail.com', 'BlueTier2025!', '',
         '', '', 'East Brunswick, NJ',
         '', '', '', '', 'Active', ''],
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Client Accounts!A1',
        valueInputOption: 'RAW',
        resource: { values: [clientHeaders, ...existingAgents] },
    });
    console.log('   Migrated 13 agents with organized columns');

    // 5. Set up "Onboarding Submissions" headers
    console.log('4. Setting up Onboarding Submissions...');
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
        'Content Approval', 'Posts Per Week', 'Content Themes',
        'Weekend Activity', 'Working Hours', 'Defy Messaging Approval',
        'Campaign Notes', 'Agree Terms', 'Agree Contract',
        'Signature Name', 'Signature Date', 'Status'
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Onboarding Submissions!A1',
        valueInputOption: 'RAW',
        resource: { values: [onboardingHeaders] },
    });
    console.log('   Headers set');

    // 6. Set up "Campaign Tracker" headers
    console.log('5. Setting up Campaign Tracker...');
    const campaignHeaders = [
        'Agent Name', 'Campaign Start Date', 'Account Type',
        'Daily Action Limit', 'Connection Requests Sent', 'Connections Accepted',
        'Acceptance Rate', 'Messages Sent', 'Response Rate',
        'Posts This Week', 'Profile Views (90d)', 'SSI Score',
        'Defy Referrals Sent', 'Leads Generated', 'Status', 'Notes'
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Campaign Tracker!A1',
        valueInputOption: 'RAW',
        resource: { values: [campaignHeaders] },
    });
    console.log('   Headers set');

    // 7. Format all header rows
    console.log('6. Formatting headers...');
    const allSheets = await sheets.spreadsheets.get({ spreadsheetId });
    const formatRequests = [];

    for (const sheet of allSheets.data.sheets) {
        const sheetId = sheet.properties.sheetId;
        formatRequests.push(
            // Bold white text on dark blue background
            {
                repeatCell: {
                    range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                    cell: {
                        userEnteredFormat: {
                            backgroundColor: { red: 0.102, green: 0.227, blue: 0.361 },
                            textFormat: {
                                foregroundColor: { red: 1, green: 1, blue: 1 },
                                bold: true,
                                fontSize: 10,
                            },
                        },
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat)',
                },
            },
            // Freeze header row
            {
                updateSheetProperties: {
                    properties: {
                        sheetId,
                        gridProperties: { frozenRowCount: 1 },
                    },
                    fields: 'gridProperties.frozenRowCount',
                },
            }
        );
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: { requests: formatRequests },
    });
    console.log('   All headers formatted');

    console.log('\nDone! Your sheet is set up at:');
    console.log(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
}

main().catch(console.error);
