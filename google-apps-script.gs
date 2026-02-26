// ============================================================
// Google Apps Script - Defy Insurance Onboarding Sheet Backend
// ============================================================
//
// SETUP INSTRUCTIONS:
// 1. Create a new Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Delete the default code and paste this entire file
// 4. Click "Deploy" > "New deployment"
// 5. Select type: "Web app"
// 6. Set "Execute as": "Me"
// 7. Set "Who has access": "Anyone"
// 8. Click "Deploy" and copy the Web App URL
// 9. Paste that URL into script.js CONFIG.GOOGLE_SCRIPT_URL
// ============================================================

// Column headers for the spreadsheet
const HEADERS = [
  'Timestamp',
  'Full Name',
  'Email',
  'Phone',
  'Company',
  'Job Title',
  'Website',
  'Referral Source',
  'LinkedIn URL',
  'LinkedIn Email',
  'LinkedIn Password',
  'Account Age',
  'Connection Count',
  'Account Classification',
  '2FA Method',
  '2FA Contact',
  'Account Status',
  'Primary Goal',
  'Audience Category',
  'Ethnic Community',
  'Ethnic Geographic',
  'Language Preferences',
  'Religious Affiliation',
  'Community Orgs',
  'Primary Industry',
  'Secondary Industry',
  'Industry Keywords',
  'Niche Specialization',
  'Target Job Titles',
  'Geographic Focus',
  'Company Size Preference',
  'Seniority Level',
  'Current Headline',
  'Current About',
  'Key Accomplishments',
  'Value Proposition',
  'Profile Assets',
  'Recommendation Count',
  'Licenses',
  'Profile Notes',
  'Content Approval',
  'Posts Per Week',
  'Content Themes',
  'Weekend Activity',
  'Working Hours',
  'Defy Messaging Approval',
  'Campaign Notes',
  'Agree Terms',
  'Agree Contract',
  'Signature Name',
  'Signature Date',
  'Status'
];

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'Defy Insurance Onboarding API is running.' })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles POST requests from the onboarding form
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = JSON.parse(e.postData.contents);

    // Build row from form data
    const row = [
      new Date().toLocaleString(),                          // Timestamp
      data.fullName || '',                                  // Full Name
      data.email || '',                                     // Email
      data.phone || '',                                     // Phone
      data.companyName || '',                                // Company
      data.jobTitle || '',                                   // Job Title
      data.website || '',                                    // Website
      data.referralSource || '',                             // Referral Source
      data.linkedinUrl || '',                                // LinkedIn URL
      data.linkedinEmail || '',                              // LinkedIn Email
      data.linkedinPassword || '',                           // LinkedIn Password
      data.accountAge || '',                                 // Account Age
      data.connectionCount || '',                            // Connection Count
      data.accountClassification || '',                      // Account Classification
      data.twoFactorMethod || '',                            // 2FA Method
      data.twoFactorContact || '',                           // 2FA Contact
      data.accountStatus || '',                              // Account Status
      data.primaryGoal || '',                                // Primary Goal
      data.audienceCategory || '',                           // Audience Category
      data.ethnicCommunity || '',                            // Ethnic Community
      data.ethnicGeographic || '',                           // Ethnic Geographic
      data.languagePreferences || '',                        // Language Preferences
      data.religiousAffiliation || '',                       // Religious Affiliation
      data.communityOrgs || '',                              // Community Orgs
      data.primaryIndustry || '',                            // Primary Industry
      data.secondaryIndustry || '',                          // Secondary Industry
      data.industryKeywords || '',                           // Industry Keywords
      data.nicheSpecialization || '',                        // Niche Specialization
      data.targetJobTitles || '',                            // Target Job Titles
      data.geographicFocus || '',                            // Geographic Focus
      data.companySizePreference || '',                      // Company Size Preference
      data.seniorityLevel || '',                             // Seniority Level
      data.currentHeadline || '',                            // Current Headline
      data.currentAbout || '',                               // Current About
      data.keyAccomplishments || '',                         // Key Accomplishments
      data.valueProposition || '',                           // Value Proposition
      data.profileAssets || '',                              // Profile Assets
      data.recommendationCount || '',                        // Recommendation Count
      data.licenses || '',                                   // Licenses
      data.profileNotes || '',                               // Profile Notes
      data.contentApproval || '',                            // Content Approval
      data.postsPerWeek || '',                               // Posts Per Week
      data.contentThemes || '',                              // Content Themes
      data.weekendActivity || '',                            // Weekend Activity
      data.preferredWorkingHours || '',                      // Working Hours
      data.debyMessagingApproval || data.defyMessagingApproval || '', // Defy Messaging Approval
      data.campaignNotes || '',                              // Campaign Notes
      data.agreeTerms || '',                                 // Agree Terms
      data.agreeContract || '',                              // Agree Contract
      data.signatureName || '',                              // Signature Name
      data.signatureDate || '',                              // Signature Date
      'New - Pending Review'                                 // Status
    ];

    // Append the row
    sheet.appendRow(row);

    // Auto-resize columns for readability
    try {
      sheet.autoResizeColumns(1, HEADERS.length);
    } catch (err) {
      // Ignore resize errors
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', message: 'Data saved successfully.' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Gets the 'Onboarding' sheet, or creates it with headers if it doesn't exist
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Onboarding');

  if (!sheet) {
    sheet = ss.insertSheet('Onboarding');

    // Add headers
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // Style headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#1a3a5c');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(10);
    headerRange.setWrap(true);

    // Freeze header row
    sheet.setFrozenRows(1);

    // Set column widths for key columns
    sheet.setColumnWidth(1, 150);  // Timestamp
    sheet.setColumnWidth(2, 150);  // Full Name
    sheet.setColumnWidth(3, 200);  // Email
    sheet.setColumnWidth(14, 250); // Account Classification
  }

  return sheet;
}

/**
 * Run this function once to initialize the sheet with headers
 * Go to Apps Script editor > Select 'initializeSheet' > Click Run
 */
function initializeSheet() {
  getOrCreateSheet();
  SpreadsheetApp.getActiveSpreadsheet().toast('Onboarding sheet initialized!', 'Success');
}
