// ============================================
// BBM Group - Onboarding Form (Frontend)
// ============================================

let currentStep = 1;
const totalSteps = 6;

// ---- INITIALIZATION ----
document.addEventListener('DOMContentLoaded', function () {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('signatureDate').value = today;
    setupConditionalFields();
    document.getElementById('onboardingForm').addEventListener('submit', handleSubmit);
});

// ---- STEP NAVIGATION ----
function changeStep(direction) {
    if (direction === 1 && !validateStep(currentStep)) return;

    const newStep = currentStep + direction;
    if (newStep < 1 || newStep > totalSteps) return;

    document.getElementById(`step${currentStep}`).classList.remove('active');

    if (direction === 1) {
        document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add('completed');
        document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.remove('active');
    }

    currentStep = newStep;
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add('active');

    if (direction === -1) {
        document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.remove('completed');
    }

    updateProgressBar();
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

function updateNavButtons() {
    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'inline-block';
    document.getElementById('nextBtn').style.display = currentStep === totalSteps ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = currentStep === totalSteps ? 'inline-block' : 'none';
}

// ---- VALIDATION ----
function validateStep(step) {
    const stepEl = document.getElementById(`step${step}`);
    const requiredInputs = stepEl.querySelectorAll('[required]');
    let valid = true;

    stepEl.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    stepEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    requiredInputs.forEach(input => {
        if (input.type === 'radio') {
            const name = input.name;
            const checked = stepEl.querySelector(`input[name="${name}"]:checked`);
            if (!checked) {
                valid = false;
                const errorEl = document.getElementById(`${name}-error`);
                if (errorEl) errorEl.textContent = 'Please select an option.';
            }
        } else if (input.type === 'checkbox') {
            if (!input.checked) {
                valid = false;
                const errorEl = document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.textContent = 'This field is required.';
            }
        } else {
            if (!input.value.trim()) {
                valid = false;
                input.classList.add('error');
                const errorEl = document.getElementById(`${input.name}-error`) ||
                    document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.textContent = 'This field is required.';
            } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                valid = false;
                input.classList.add('error');
                const errorEl = document.getElementById(`${input.name}-error`) ||
                    document.getElementById(`${input.id}-error`);
                if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
            }
        }
    });

    if (step === 3) {
        const audienceChecked = stepEl.querySelectorAll('input[name="audienceCategory"]:checked');
        if (audienceChecked.length === 0) {
            valid = false;
            const errorEl = document.getElementById('audienceCategory-error');
            if (errorEl) errorEl.textContent = 'Please select at least one target audience category.';
        }
    }

    if (!valid) {
        const firstError = stepEl.querySelector('.error, .error-msg:not(:empty)');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
}

// ---- CONDITIONAL FIELDS ----
function setupConditionalFields() {
    document.getElementById('cat_ethnic')?.addEventListener('change', function () {
        document.getElementById('ethnicDetails').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('cat_religious')?.addEventListener('change', function () {
        document.getElementById('religiousDetails').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('cat_industry')?.addEventListener('change', function () {
        document.getElementById('industryDetails').style.display = this.checked ? 'block' : 'none';
    });
    document.getElementById('twoFactorMethod')?.addEventListener('change', function () {
        document.getElementById('twoFactorContactGroup').style.display =
            this.value === 'none' ? 'none' : 'block';
    });
}

// ---- FORM SUBMISSION ----
async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const formData = collectFormData();

    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.status === 'success') {
            showSuccessMessage();
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting the form. Please try again.\n\n' + error.message);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function collectFormData() {
    const form = document.getElementById('onboardingForm');
    const data = {};

    // Text inputs, selects, textareas
    form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="password"], input[type="date"], select, textarea')
        .forEach(input => { data[input.name || input.id] = input.value; });

    // Radio buttons
    form.querySelectorAll('input[type="radio"]:checked')
        .forEach(radio => { data[radio.name] = radio.value; });

    // Checkbox groups
    const checkboxGroups = {};
    form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        if (cb.name && cb.name !== 'agreeTerms') {
            if (!checkboxGroups[cb.name]) checkboxGroups[cb.name] = [];
            checkboxGroups[cb.name].push(cb.value);
        }
    });
    Object.keys(checkboxGroups).forEach(key => { data[key] = checkboxGroups[key].join(', '); });

    data.agreeTerms = document.getElementById('agreeTerms').checked ? 'Yes' : 'No';
    data.submittedAt = new Date().toISOString();

    // Account classification
    const conn = data.connectionCount;
    const age = data.accountAge;
    if (conn === '5000_plus' && age === '3_plus_years') {
        data.accountClassification = 'OLD/MATURE - 150 actions/day - Low Risk';
    } else if (['1000_to_2999', '3000_to_4999'].includes(conn) && ['1_to_3_years', '3_plus_years'].includes(age)) {
        data.accountClassification = 'MEDIUM - 80 actions/day - Medium Risk';
    } else {
        data.accountClassification = 'NEW - 80 actions/day (conservative) - High Risk';
    }

    return data;
}

function showSuccessMessage() {
    document.getElementById('onboardingForm').style.display = 'none';
    document.querySelector('.form-navigation').style.display = 'none';
    document.querySelector('.progress-container').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
