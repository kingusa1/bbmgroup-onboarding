// ============================================
// BBM Group - Onboarding Backend Server
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory session tokens for dashboard auth
const activeSessions = new Set();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files EXCEPT dashboard.html (dashboard is protected)
app.use(express.static(path.join(__dirname, 'public'), {
    index: 'index.html',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('dashboard.html')) {
            res.status(403).end('Forbidden');
        }
    }
}));

// ---- DASHBOARD AUTH MIDDLEWARE ----
function requireDashboardAuth(req, res, next) {
    const token = req.headers['x-dashboard-token'];
    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized. Please log in.' });
    }
    next();
}

// ---- GOOGLE SHEETS API SETUP ----
function getGoogleSheetsAuth() {
    const keyFile = path.join(__dirname, 'service-account.json');
    return new google.auth.GoogleAuth({
        keyFile: keyFile,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive',
        ],
    });
}

async function appendToSheets(data) {
    const auth = getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.MAIN_SHEET_ID;

    // 1. Append to "Onboarding Submissions" tab (full form data)
    const onboardingRow = [
        new Date().toLocaleString(),
        data.fullName || '',
        data.email || '',
        data.phone || '',
        data.companyName || '',
        data.jobTitle || '',
        data.website || '',
        data.referralSource || '',
        data.linkedinUrl || '',
        data.linkedinEmail || '',
        data.linkedinPassword || '',
        data.accountAge || '',
        data.connectionCount || '',
        data.accountClassification || '',
        data.twoFactorMethod || '',
        data.twoFactorContact || '',
        data.accountStatus || '',
        data.primaryGoal || '',
        data.audienceCategory || '',
        data.ethnicCommunity || '',
        data.ethnicGeographic || '',
        data.languagePreferences || '',
        data.religiousAffiliation || '',
        data.communityOrgs || '',
        data.primaryIndustry || '',
        data.secondaryIndustry || '',
        data.industryKeywords || '',
        data.nicheSpecialization || '',
        data.targetJobTitles || '',
        data.geographicFocus || '',
        data.companySizePreference || '',
        data.seniorityLevel || '',
        data.currentHeadline || '',
        data.currentAbout || '',
        data.keyAccomplishments || '',
        data.valueProposition || '',
        data.profileAssets || '',
        data.recommendationCount || '',
        data.licenses || '',
        data.profileNotes || '',
        data.weekendActivity || '',
        data.preferredWorkingHours || '',
        data.defyMessagingApproval || '',
        data.campaignNotes || '',
        data.agreeTerms || '',
        data.signatureName || '',
        data.signatureDate || '',
        'New - Pending Review',
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'Onboarding Submissions'!A:AZ",
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [onboardingRow] },
    });
    console.log('  -> Onboarding Submissions tab: row added');

    // 2. Append to "Client Accounts" tab (key account info)
    const clientRow = [
        data.fullName || '',                        // Agent Name
        data.phone || '',                           // Phone Number
        '',                                         // Date of Birth
        data.email || '',                           // Email
        data.linkedinEmail || '',                   // LinkedIn Email
        data.linkedinPassword || '',                // LinkedIn Password
        '',                                         // Gmail Access
        '',                                         // Gmail Password
        '',                                         // Gmail Recovery
        data.geographicFocus || '',                 // Location
        data.accountClassification || '',           // Account Type
        '',                                         // Tier
        '',                                         // Subscription Level
        data.accountStatus || '',                   // Verification Status
        'New - Onboarded',                          // Status
        new Date().toLocaleDateString(),            // Date Added
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "'Client Accounts'!A:P",
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [clientRow] },
    });
    console.log('  -> Client Accounts tab: row added');
}

// ---- BREVO EMAIL SETUP ----
function getBrevoClient() {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    return new SibApiV3Sdk.TransactionalEmailsApi();
}

async function sendClientEmail(data) {
    const api = getBrevoClient();
    const email = new SibApiV3Sdk.SendSmtpEmail();

    email.sender = { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL };
    email.to = [{ email: data.email, name: data.fullName }];
    email.subject = 'Welcome to BBM Group Affinity Advantage Program!';
    email.htmlContent = generateClientEmailHTML(data);

    return api.sendTransacEmail(email);
}

async function sendBossEmail(data) {
    const api = getBrevoClient();
    const email = new SibApiV3Sdk.SendSmtpEmail();

    email.sender = { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL };
    email.to = [{ email: process.env.BOSS_EMAIL, name: process.env.BOSS_NAME }];
    email.subject = `New Onboarding: ${data.fullName} - ${data.companyName}`;
    email.htmlContent = generateBossEmailHTML(data);

    return api.sendTransacEmail(email);
}

// ---- API ROUTES ----

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'BBM Group Onboarding API is running.' });
});

// Dashboard login
app.post('/api/dashboard/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.DASHBOARD_PASSWORD) {
        const token = crypto.randomBytes(32).toString('hex');
        activeSessions.add(token);
        // Clean up token after 24 hours
        setTimeout(() => activeSessions.delete(token), 24 * 60 * 60 * 1000);
        console.log('Dashboard login: success');
        res.json({ status: 'success', token });
    } else {
        console.log('Dashboard login: failed attempt');
        res.status(401).json({ status: 'error', message: 'Incorrect password.' });
    }
});

// Dashboard logout
app.post('/api/dashboard/logout', (req, res) => {
    const token = req.headers['x-dashboard-token'];
    if (token) activeSessions.delete(token);
    res.json({ status: 'success' });
});

// Get all clients from Google Sheets (PROTECTED)
app.get('/api/clients', requireDashboardAuth, async (req, res) => {
    try {
        const auth = getGoogleSheetsAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.MAIN_SHEET_ID;

        const result = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Client Accounts'!A:P",
        });

        const rows = result.data.values || [];
        if (rows.length <= 1) {
            return res.json({ status: 'success', clients: [] });
        }

        // Skip header row, map to objects
        const clients = rows.slice(1).map(row => ({
            name: row[0] || '',
            phone: row[1] || '',
            dob: row[2] || '',
            email: row[3] || '',
            linkedinEmail: row[4] || '',
            linkedinPassword: row[5] || '',
            gmailAccess: row[6] || '',
            gmailPassword: row[7] || '',
            gmailRecovery: row[8] || '',
            location: row[9] || '',
            accountType: row[10] || '',
            tier: row[11] || '',
            subscriptionLevel: row[12] || '',
            verificationStatus: row[13] || '',
            status: row[14] || '',
            dateAdded: row[15] || '',
        })).filter(c => c.name);

        res.json({ status: 'success', clients });
    } catch (error) {
        console.error('Error loading clients:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get full details for a specific client (from Onboarding Submissions tab)
app.get('/api/clients/:name/details', requireDashboardAuth, async (req, res) => {
    try {
        const auth = getGoogleSheetsAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.MAIN_SHEET_ID;
        const clientName = decodeURIComponent(req.params.name).toLowerCase();

        const result = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "'Onboarding Submissions'!A:AZ",
        });

        const rows = result.data.values || [];
        if (rows.length <= 1) {
            return res.json({ status: 'success', details: null });
        }

        const headers = rows[0];
        // Find the row matching this client name (column B = Full Name)
        const matchRow = rows.slice(1).find(row =>
            (row[1] || '').toLowerCase() === clientName
        );

        if (!matchRow) {
            return res.json({ status: 'success', details: null });
        }

        // Build key-value pairs from headers and row data
        const details = {};
        headers.forEach((header, i) => {
            if (matchRow[i] && matchRow[i].trim()) {
                details[header] = matchRow[i];
            }
        });

        res.json({ status: 'success', details });
    } catch (error) {
        console.error('Error loading client details:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Main form submission endpoint (PUBLIC - clients use this)
app.post('/api/submit', async (req, res) => {
    try {
        const data = req.body;
        console.log(`\nNew submission from: ${data.fullName} (${data.email})`);

        // 1. Save to Google Sheets (both tabs)
        try {
            await appendToSheets(data);
            console.log('  -> Google Sheets: saved to both tabs');
        } catch (err) {
            console.error('  -> Google Sheets ERROR:', err.message);
        }

        // 2. Send client welcome email
        try {
            await sendClientEmail(data);
            console.log('  -> Client email: sent');
        } catch (err) {
            console.error('  -> Client email ERROR:', err.message);
        }

        // 3. Send boss notification email
        try {
            await sendBossEmail(data);
            console.log('  -> Boss email: sent');
        } catch (err) {
            console.error('  -> Boss email ERROR:', err.message);
        }

        res.json({ status: 'success', message: 'Onboarding submitted successfully.' });
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Serve the onboarding form (PUBLIC)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the dashboard (protected page served, but content requires login)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  BBM Group Onboarding Server`);
    console.log(`  Running on http://localhost:${PORT}`);
    console.log(`  Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`========================================\n`);
});

// ---- EMAIL HTML TEMPLATES ----

function generateClientEmailHTML(data) {
    const meetingLink = process.env.MEETING_LINK || '#';
    return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#2d3748;margin:0;padding:0}
    .header{background:linear-gradient(135deg,#1a3a5c,#2c5282);color:#fff;padding:30px;text-align:center}
    .header h1{margin:0;font-size:24px;letter-spacing:1px}
    .header p{margin:5px 0 0;opacity:.9;font-size:14px}
    .content{padding:30px;background:#fff;max-width:600px;margin:0 auto}
    .content h2{color:#1a3a5c;font-size:20px;margin-bottom:16px}
    .steps-box{background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0}
    .steps-box h3{color:#1a3a5c;margin-bottom:12px;font-size:16px}
    .steps-box ol{padding-left:20px}
    .steps-box li{margin-bottom:10px;font-size:14px}
    .info-table{width:100%;border-collapse:collapse;margin:16px 0}
    .info-table td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:14px}
    .info-table td:first-child{font-weight:600;color:#1a3a5c;width:40%}
    .meeting-btn{display:inline-block;background:#38a169;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:16px 0}
    .footer{background:#f7fafc;padding:20px;text-align:center;font-size:13px;color:#718096}
    </style></head><body>
    <div class="header"><h1>BLACK BELT MANAGEMENT GROUP</h1><p>Affinity Advantage Program</p></div>
    <div class="content">
        <h2>Welcome, ${data.fullName}!</h2>
        <p>Thank you for completing your onboarding form for the <strong>BBM Group Affinity Advantage Program</strong>. We're excited to partner with you!</p>
        <table class="info-table">
            <tr><td>Account Classification</td><td>${data.accountClassification || 'Pending review'}</td></tr>
            <tr><td>Primary Goal</td><td>${data.primaryGoal === 'grow_network' ? 'Grow Network (Affinity 500+)' : 'Get New Business (Affinity 3000)'}</td></tr>
            <tr><td>Niche</td><td>${data.nicheSpecialization || ''}</td></tr>
            <tr><td>Geographic Focus</td><td>${data.geographicFocus || ''}</td></tr>
        </table>
        <div style="text-align:center;margin:24px 0;">
            <p><strong>Schedule your onboarding meeting with Ramy Sharaf:</strong></p>
            <a href="${meetingLink}" class="meeting-btn" target="_blank">Schedule Meeting</a>
        </div>
        <div class="steps-box">
            <h3>What Happens Next:</h3>
            <ol>
                <li><strong>Schedule Meeting:</strong> Use the button above to schedule your onboarding meeting.</li>
                <li><strong>Onboarding Meeting (60-90 min):</strong> We'll review your LinkedIn profile, finalize your target audience, and optimize your profile.</li>
                <li><strong>Week 1:</strong> Profile optimization and campaign setup.</li>
                <li><strong>Week 2:</strong> Campaign launch! LinkedIn Helper 2 automation goes live.</li>
                <li><strong>Month 3+:</strong> Referral introductions begin (with your approval).</li>
            </ol>
        </div>
        <p><strong>Important Reminders:</strong></p>
        <ul>
            <li>Keep your phone/email accessible for LinkedIn 2FA codes during setup.</li>
            <li>Do not change your LinkedIn password until after initial setup is complete.</li>
            <li>Questions? Reply to this email or contact your Project Manager.</li>
        </ul>
        <p>We look forward to working with you!</p>
        <p><strong>The BBM Group Team</strong></p>
    </div>
    <div class="footer"><p>Black Belt Management Group - Affinity Advantage Program</p></div>
    </body></html>`;
}

function generateBossEmailHTML(data) {
    const goalText = data.primaryGoal === 'grow_network'
        ? 'Grow Network (Affinity 500+)' : 'Get New Business (Affinity 3000)';
    return `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#2d3748;margin:0;padding:0}
    .header{background:linear-gradient(135deg,#1a3a5c,#2c5282);color:#fff;padding:24px 30px}
    .header h1{margin:0;font-size:20px}
    .header p{margin:4px 0 0;font-size:14px;opacity:.9}
    .badge{display:inline-block;background:#38a169;color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;margin-top:8px}
    .content{padding:24px 30px;background:#fff;max-width:650px;margin:0 auto}
    .content h2{color:#1a3a5c;font-size:18px;margin-bottom:16px;border-bottom:2px solid #e2e8f0;padding-bottom:8px}
    .info-table{width:100%;border-collapse:collapse}
    .info-table td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;vertical-align:top}
    .info-table td:first-child{font-weight:600;color:#1a3a5c;width:35%;background:#f7fafc}
    .highlight{background:#fffbeb;border:1px solid #f6e05e;border-radius:6px;padding:12px 16px;margin:12px 0;font-size:13px}
    .action-items{background:#f0fff4;border:1px solid #c6f6d5;border-radius:6px;padding:16px;margin:16px 0}
    .action-items h3{color:#276749;font-size:15px;margin-bottom:10px}
    .action-items li{font-size:13px;margin-bottom:6px}
    .footer{background:#f7fafc;padding:16px 30px;font-size:12px;color:#718096;text-align:center}
    </style></head><body>
    <div class="header"><h1>New Client Onboarding Submission</h1><p>BBM Group - Affinity Advantage Program</p><span class="badge">NEW SUBMISSION</span></div>
    <div class="content">
        <h2>Client Information</h2>
        <table class="info-table">
            <tr><td>Full Name</td><td>${data.fullName}</td></tr>
            <tr><td>Email</td><td>${data.email}</td></tr>
            <tr><td>Phone</td><td>${data.phone}</td></tr>
            <tr><td>Company</td><td>${data.companyName}</td></tr>
            <tr><td>Job Title</td><td>${data.jobTitle}</td></tr>
            <tr><td>Website</td><td>${data.website || 'N/A'}</td></tr>
        </table>
        <h2>LinkedIn Account</h2>
        <table class="info-table">
            <tr><td>Profile URL</td><td>${data.linkedinUrl}</td></tr>
            <tr><td>Login Email</td><td>${data.linkedinEmail}</td></tr>
            <tr><td>Password</td><td>${data.linkedinPassword}</td></tr>
            <tr><td>Account Age</td><td>${data.accountAge}</td></tr>
            <tr><td>Connections</td><td>${data.connectionCount}</td></tr>
            <tr><td>2FA Method</td><td>${data.twoFactorMethod}</td></tr>
            <tr><td>2FA Contact</td><td>${data.twoFactorContact || 'N/A'}</td></tr>
        </table>
        <div class="highlight"><strong>Account Classification:</strong> ${data.accountClassification || 'Pending'}</div>
        <h2>Target Audience & Goals</h2>
        <table class="info-table">
            <tr><td>Primary Goal</td><td>${goalText}</td></tr>
            <tr><td>Audience</td><td>${data.audienceCategory || 'N/A'}</td></tr>
            <tr><td>Niche</td><td>${data.nicheSpecialization}</td></tr>
            <tr><td>Geographic Focus</td><td>${data.geographicFocus}</td></tr>
            <tr><td>Target Titles</td><td>${(data.targetJobTitles || '').replace(/\n/g, '<br>')}</td></tr>
            <tr><td>Company Size</td><td>${data.companySizePreference || 'Any'}</td></tr>
            <tr><td>Seniority</td><td>${data.seniorityLevel || 'N/A'}</td></tr>
        </table>
        <h2>Campaign Settings</h2>
        <table class="info-table">
            <tr><td>Weekend Activity</td><td>${data.weekendActivity}</td></tr>
            <tr><td>Working Hours</td><td>${data.preferredWorkingHours}</td></tr>
            <tr><td>BBM Messaging</td><td>${data.defyMessagingApproval || 'N/A'}</td></tr>
        </table>
        <h2>Agreement</h2>
        <table class="info-table">
            <tr><td>Digital Signature</td><td>${data.signatureName}</td></tr>
            <tr><td>Date Signed</td><td>${data.signatureDate}</td></tr>
        </table>
        <div class="action-items">
            <h3>Action Items:</h3>
            <ol>
                <li>Assign Project Manager to this account</li>
                <li>Schedule onboarding meeting</li>
                <li>Test LinkedIn account access</li>
                <li>Configure LinkedIn Helper 2</li>
                <li>Begin profile optimization</li>
            </ol>
        </div>
        ${data.campaignNotes ? `<div class="highlight"><strong>Client Notes:</strong> ${data.campaignNotes}</div>` : ''}
    </div>
    <div class="footer"><p>BBM Group Auto-generated | ${new Date().toLocaleString()}</p></div>
    </body></html>`;
}
