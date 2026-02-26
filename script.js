// ============================================
// Defy Insurance - Onboarding Form Script
// ============================================

// ---- CONFIGURATION ----
// Replace these with your actual values after setup
const CONFIG = {
    // Google Apps Script Web App URL (from deploying the Google Apps Script)
    GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',

    // Brevo (formerly Sendinblue) API Key
    BREVO_API_KEY: 'YOUR_BREVO_API_KEY_HERE',

    // Boss email - receives notification on every submission
    BOSS_EMAIL: 'boss@defyinsurance.com',
    BOSS_NAME: 'Defy Insurance Team',

    // Sender email (must be verified in Brevo)
    SENDER_EMAIL: 'onboarding@defyinsurance.com',
    SENDER_NAME: 'Defy Insurance - Affinity Program',
};

let currentStep = 1;
const totalSteps = 6;

// ---- INITIALIZATION ----
document.addEventListener('DOMContentLoaded', function () {
    // Set today's date as default for signature date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('signatureDate').value = today;

    // Setup conditional field listeners
    setupConditionalFields();

    // Form submission handler
    document.getElementById('onboardingForm').addEventListener('submit', handleSubmit);
});

// ---- STEP NAVIGATION ----
function changeStep(direction) {
    // Validate current step before moving forward
    if (direction === 1 && !validateStep(currentStep)) {
        return;
    }

    // Update step
    const newStep = currentStep + direction;
    if (newStep < 1 || newStep > totalSteps) return;

    // Hide current step
    document.getElementById(`step${currentStep}`).classList.remove('active');

    // Mark completed steps
    if (direction === 1) {
        document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add('completed');
        document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.remove('active');
    }

    // Show new step
    currentStep = newStep;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add('active');

    // If going back, remove completed from current step
    if (direction === -1) {
        document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.remove('completed');
    }

    // Update progress bar
    updateProgressBar();

    // Update navigation buttons
    updateNavButtons();

    // Scroll to top of form
    window.scrollTo({ top: 200, behavior: 'smooth' });
}

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

function updateNavButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
    nextBtn.style.display = currentStep === totalSteps ? 'none' : 'block';
    submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
}

// ---- VALIDATION ----
function validateStep(step) {
    const stepEl = document.getElementById(`step${step}`);
    const requiredInputs = stepEl.querySelectorAll('[required]');
    let valid = true;

    // Clear previous errors
    stepEl.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    stepEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            // Radio group validation
            const name = input.name;
            const checked = stepEl.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                valid = false;
                const errorEl = document.getElementById(`${name}-error`);
                if (errorEl) errorEl.textContent = 'Please select an option.';
            }
        } else if (input.type === 'checkbox') {
            // Single checkbox (like agreements)
            if (!input.checked) {
                valid = false;
                const errorEl = document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.textContent = 'This field is required.';
                input.closest('.checkbox-label')?.classList.add('error-highlight');
            }
        } else {
            // Text inputs, selects, etc.
            if (!input.value.trim()) {
                valid = false;
                input.classList.add('error');
                const errorEl = document.getElementById(`${input.name}-error`) ||
                    document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.textContent = 'This field is required.';
            } else if (input.type === 'email' && !isValidEmail(input.value)) {
                valid = false;
                input.classList.add('error');
                const errorEl = document.getElementById(`${input.name}-error`) ||
                    document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
            }
        }
    });

    // Step 3: validate at least one audience category
    if (step === 3) {
        const audienceChecked = stepEl.querySelectorAll('input[name="audienceCategory"]:checked');
        if (audienceChecked.length === 0) {
            valid = false;
            const errorEl = document.getElementById('audienceCategory-error');
            if (errorEl) errorEl.textContent = 'Please select at least one target audience category.';
        }
    }

    if (!valid) {
        // Scroll to first error
        const firstError = stepEl.querySelector('.error, .error-msg:not(:empty)');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return valid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- CONDITIONAL FIELDS ----
function setupConditionalFields() {
    // Target audience category toggles
    document.getElementById('cat_ethnic')?.addEventListener('change', function () {
        document.getElementById('ethnicDetails').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('cat_religious')?.addEventListener('change', function () {
        document.getElementById('religiousDetails').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('cat_industry')?.addEventListener('change', function () {
        document.getElementById('industryDetails').style.display = this.checked ? 'block' : 'none';
    });

    // 2FA method - show/hide contact field
    document.getElementById('twoFactorMethod')?.addEventListener('change', function () {
        const contactGroup = document.getElementById('twoFactorContactGroup');
        if (this.value === 'none') {
            contactGroup.style.display = 'none';
        } else {
            contactGroup.style.display = 'block';
        }
    });
}

// ---- FORM SUBMISSION ----
async function handleSubmit(e) {
    e.preventDefault();

    // Validate last step
    if (!validateStep(currentStep)) return;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Collect all form data
    const formData = collectFormData();

    try {
        // Send to Google Sheets
        await sendToGoogleSheets(formData);

        // Send emails via Brevo
        await sendEmails(formData);

        // Show success message
        showSuccessMessage();
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting the form. Please try again or contact support.\n\nError: ' + error.message);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function collectFormData() {
    const form = document.getElementById('onboardingForm');
    const data = {};

    // Text inputs, selects, textareas
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], input[type="date"], select, textarea');
    inputs.forEach(input => {
        data[input.name || input.id] = input.value;
    });

    // Radio buttons
    const radios = form.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(radio => {
        data[radio.name] = radio.value;
    });

    // Checkbox groups
    const checkboxGroups = {};
    form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        if (cb.name && cb.name !== 'agreeTerms' && cb.name !== 'agreeContract') {
            if (!checkboxGroups[cb.name]) checkboxGroups[cb.name] = [];
            checkboxGroups[cb.name].push(cb.value);
        }
    });
    Object.keys(checkboxGroups).forEach(key => {
        data[key] = checkboxGroups[key].join(', ');
    });

    // Agreement fields
    data.agreeTerms = document.getElementById('agreeTerms').checked ? 'Yes' : 'No';
    data.agreeContract = document.getElementById('agreeContract').checked ? 'Yes' : 'No';

    // Timestamp
    data.submittedAt = new Date().toISOString();

    // Determine account classification
    data.accountClassification = classifyAccount(data.connectionCount, data.accountAge);

    return data;
}

function classifyAccount(connections, age) {
    if (connections === '5000_plus' && age === '3_plus_years') {
        return 'OLD/MATURE - 150 actions/day - Low Risk';
    } else if (['1000_to_2999', '3000_to_4999'].includes(connections) && ['1_to_3_years', '3_plus_years'].includes(age)) {
        return 'MEDIUM - 80 actions/day - Medium Risk';
    } else {
        return 'NEW - 80 actions/day (conservative) - High Risk';
    }
}

// ---- GOOGLE SHEETS INTEGRATION ----
async function sendToGoogleSheets(data) {
    if (CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.warn('Google Sheets URL not configured. Skipping Google Sheets submission.');
        return;
    }

    const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    return response;
}

// ---- BREVO EMAIL INTEGRATION ----
async function sendEmails(formData) {
    if (CONFIG.BREVO_API_KEY === 'YOUR_BREVO_API_KEY_HERE') {
        console.warn('Brevo API key not configured. Skipping email notifications.');
        return;
    }

    // Send welcome email to client
    await sendBrevoEmail({
        to: [{ email: formData.email, name: formData.fullName }],
        subject: 'Welcome to Defy Insurance Affinity Advantage Program!',
        htmlContent: generateClientEmail(formData),
    });

    // Send notification email to boss
    await sendBrevoEmail({
        to: [{ email: CONFIG.BOSS_EMAIL, name: CONFIG.BOSS_NAME }],
        subject: `New Onboarding Submission: ${formData.fullName} - ${formData.companyName}`,
        htmlContent: generateBossEmail(formData),
    });
}

async function sendBrevoEmail({ to, subject, htmlContent }) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': CONFIG.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: CONFIG.SENDER_NAME, email: CONFIG.SENDER_EMAIL },
            to: to,
            subject: subject,
            htmlContent: htmlContent,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Email send failed: ${errorData.message || response.statusText}`);
    }

    return response.json();
}

// ---- EMAIL TEMPLATES ----
function generateClientEmail(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #2d3748; margin: 0; padding: 0; }
            .email-container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #1a3a5c, #2c5282); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
            .content { padding: 30px; background: #ffffff; }
            .content h2 { color: #1a3a5c; font-size: 20px; margin-bottom: 16px; }
            .content p { margin-bottom: 12px; font-size: 15px; }
            .steps-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .steps-box h3 { color: #1a3a5c; margin-bottom: 12px; font-size: 16px; }
            .steps-box ol { padding-left: 20px; }
            .steps-box li { margin-bottom: 10px; font-size: 14px; }
            .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .info-table td:first-child { font-weight: 600; color: #1a3a5c; width: 40%; }
            .footer { background: #f7fafc; padding: 20px; text-align: center; font-size: 13px; color: #718096; }
            .footer em { color: #4a7ab5; }
            .cta-btn { display: inline-block; background: #3182ce; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>DEFY INSURANCE</h1>
                <p>Affinity Advantage Program</p>
            </div>
            <div class="content">
                <h2>Welcome, ${data.fullName}!</h2>
                <p>Thank you for completing your onboarding form for the <strong>Defy Insurance Affinity Advantage Program</strong>. We're excited to partner with you to grow your professional network and business!</p>

                <table class="info-table">
                    <tr><td>Account Classification</td><td>${data.accountClassification}</td></tr>
                    <tr><td>Primary Goal</td><td>${data.primaryGoal === 'grow_network' ? 'Grow Network (Affinity 500+)' : 'Get New Business (Affinity 3000)'}</td></tr>
                    <tr><td>Niche</td><td>${data.nicheSpecialization}</td></tr>
                    <tr><td>Geographic Focus</td><td>${data.geographicFocus}</td></tr>
                </table>

                <div class="steps-box">
                    <h3>What Happens Next:</h3>
                    <ol>
                        <li><strong>Within 24 Hours:</strong> Your Project Manager will review your submission and reach out to schedule your onboarding meeting.</li>
                        <li><strong>Onboarding Meeting (60-90 min):</strong> We'll review your LinkedIn profile, finalize your target audience, and optimize your profile together.</li>
                        <li><strong>Week 1:</strong> Profile optimization, content calendar creation, and campaign setup.</li>
                        <li><strong>Week 2:</strong> Campaign launch! Your outreach automation automation goes live with connection invitations and engagement.</li>
                        <li><strong>Month 3+:</strong> Defy Insurance referral introductions begin (with your approval).</li>
                    </ol>
                </div>

                <p><strong>Important Reminders:</strong></p>
                <ul>
                    <li>Please keep your phone/email accessible for LinkedIn 2FA codes during the setup process.</li>
                    <li>Do not change your LinkedIn password until after the initial setup is complete.</li>
                    <li>If you have any questions, reply to this email or contact your Project Manager directly.</li>
                </ul>

                <p>We look forward to working with you!</p>
                <p><strong>The Defy Insurance Team</strong></p>
            </div>
            <div class="footer">
                <p>Defy Insurance - Affinity Advantage Program</p>
                <p><em>We market. You shine.</em></p>
                <p>Confidential - This email contains information intended for the recipient only.</p>
            </div>
        </div>
    </body>
    </html>`;
}

function generateBossEmail(data) {
    const goalText = data.primaryGoal === 'grow_network'
        ? 'Grow Network (Affinity 500+ Program)'
        : 'Get New Business (Affinity 3000 Program)';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #2d3748; margin: 0; padding: 0; }
            .email-container { max-width: 650px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #1a3a5c, #2c5282); color: white; padding: 24px 30px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 4px 0 0; font-size: 14px; opacity: 0.9; }
            .badge { display: inline-block; background: #38a169; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 8px; }
            .content { padding: 24px 30px; background: #ffffff; }
            .content h2 { color: #1a3a5c; font-size: 18px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .section { margin-bottom: 24px; }
            .info-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top; }
            .info-table td:first-child { font-weight: 600; color: #1a3a5c; width: 35%; background: #f7fafc; }
            .highlight { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 6px; padding: 12px 16px; margin: 12px 0; font-size: 13px; }
            .action-items { background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 6px; padding: 16px; margin: 16px 0; }
            .action-items h3 { color: #276749; font-size: 15px; margin-bottom: 10px; }
            .action-items li { font-size: 13px; margin-bottom: 6px; }
            .footer { background: #f7fafc; padding: 16px 30px; font-size: 12px; color: #718096; text-align: center; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>New Client Onboarding Submission</h1>
                <p>Affinity Advantage Program</p>
                <span class="badge">NEW SUBMISSION</span>
            </div>
            <div class="content">

                <div class="section">
                    <h2>Client Information</h2>
                    <table class="info-table">
                        <tr><td>Full Name</td><td>${data.fullName}</td></tr>
                        <tr><td>Email</td><td>${data.email}</td></tr>
                        <tr><td>Phone</td><td>${data.phone}</td></tr>
                        <tr><td>Company</td><td>${data.companyName}</td></tr>
                        <tr><td>Job Title</td><td>${data.jobTitle}</td></tr>
                        <tr><td>Website</td><td>${data.website || 'N/A'}</td></tr>
                        <tr><td>Referral Source</td><td>${data.referralSource || 'N/A'}</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h2>LinkedIn Account Details</h2>
                    <table class="info-table">
                        <tr><td>Profile URL</td><td>${data.linkedinUrl}</td></tr>
                        <tr><td>Login Email</td><td>${data.linkedinEmail}</td></tr>
                        <tr><td>Account Age</td><td>${data.accountAge}</td></tr>
                        <tr><td>Connection Count</td><td>${data.connectionCount}</td></tr>
                        <tr><td>2FA Method</td><td>${data.twoFactorMethod}</td></tr>
                        <tr><td>2FA Contact</td><td>${data.twoFactorContact || 'N/A'}</td></tr>
                        <tr><td>Account Status</td><td>${data.accountStatus || 'N/A'}</td></tr>
                    </table>
                    <div class="highlight">
                        <strong>Account Classification:</strong> ${data.accountClassification}
                    </div>
                </div>

                <div class="section">
                    <h2>Target Audience & Goals</h2>
                    <table class="info-table">
                        <tr><td>Primary Goal</td><td>${goalText}</td></tr>
                        <tr><td>Audience Category</td><td>${data.audienceCategory || 'N/A'}</td></tr>
                        <tr><td>Niche</td><td>${data.nicheSpecialization}</td></tr>
                        <tr><td>Geographic Focus</td><td>${data.geographicFocus}</td></tr>
                        <tr><td>Company Size Pref.</td><td>${data.companySizePreference || 'Any'}</td></tr>
                        <tr><td>Seniority Level</td><td>${data.seniorityLevel || 'N/A'}</td></tr>
                        <tr><td>Target Job Titles</td><td>${(data.targetJobTitles || '').replace(/\n/g, '<br>')}</td></tr>
                        ${data.ethnicCommunity ? `<tr><td>Ethnic Community</td><td>${data.ethnicCommunity}</td></tr>` : ''}
                        ${data.primaryIndustry ? `<tr><td>Primary Industry</td><td>${data.primaryIndustry}</td></tr>` : ''}
                        ${data.secondaryIndustry ? `<tr><td>Secondary Industry</td><td>${data.secondaryIndustry}</td></tr>` : ''}
                    </table>
                </div>

                <div class="section">
                    <h2>Profile & Campaign</h2>
                    <table class="info-table">
                        <tr><td>Current Headline</td><td>${data.currentHeadline || 'Not provided'}</td></tr>
                        <tr><td>Value Proposition</td><td>${data.valueProposition || 'Not provided'}</td></tr>
                        <tr><td>Profile Assets</td><td>${data.profileAssets || 'None selected'}</td></tr>
                        <tr><td>Recommendations</td><td>${data.recommendationCount || '0'}</td></tr>
                        <tr><td>Licenses</td><td>${data.licenses || 'None selected'}</td></tr>
                        <tr><td>Content Approval</td><td>${data.contentApproval === 'review_all' ? 'Wants to review all content' : 'Trusts the team'}</td></tr>
                        <tr><td>Posts/Week</td><td>${data.postsPerWeek}</td></tr>
                        <tr><td>Content Themes</td><td>${data.contentThemes || 'None selected'}</td></tr>
                        <tr><td>Weekend Activity</td><td>${data.weekendActivity}</td></tr>
                        <tr><td>Working Hours</td><td>${data.preferredWorkingHours}</td></tr>
                        <tr><td>Defy Messaging</td><td>${data.debyMessagingApproval || data.defyMessagingApproval || 'N/A'}</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h2>Agreement</h2>
                    <table class="info-table">
                        <tr><td>Terms Agreed</td><td>${data.agreeTerms}</td></tr>
                        <tr><td>Contract Agreed</td><td>${data.agreeContract}</td></tr>
                        <tr><td>Digital Signature</td><td>${data.signatureName}</td></tr>
                        <tr><td>Date Signed</td><td>${data.signatureDate}</td></tr>
                        <tr><td>Submitted At</td><td>${new Date(data.submittedAt).toLocaleString()}</td></tr>
                    </table>
                </div>

                <div class="action-items">
                    <h3>Action Items for Project Manager:</h3>
                    <ol>
                        <li>Assign a Project Manager to this account</li>
                        <li>Send post-meeting email within 24 hours</li>
                        <li>Notify Ramy (lead generator) of new client</li>
                        <li>Schedule 60-90 min onboarding meeting</li>
                        <li>Test LinkedIn account access with provided credentials</li>
                        <li>Configure outreach automation with ${data.accountClassification.split(' - ')[1] || '80 actions/day'}</li>
                        <li>Begin profile optimization</li>
                        <li>Create content calendar and messaging templates</li>
                    </ol>
                </div>

                ${data.campaignNotes ? `<div class="highlight"><strong>Client Notes:</strong> ${data.campaignNotes}</div>` : ''}
                ${data.profileNotes ? `<div class="highlight"><strong>Profile Notes:</strong> ${data.profileNotes}</div>` : ''}
            </div>
            <div class="footer">
                <p>Defy Insurance - Affinity Advantage Program | Auto-generated notification</p>
                <p>Submitted: ${new Date(data.submittedAt).toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>`;
}

// ---- SUCCESS ----
function showSuccessMessage() {
    document.getElementById('onboardingForm').style.display = 'none';
    document.querySelector('.form-navigation').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
