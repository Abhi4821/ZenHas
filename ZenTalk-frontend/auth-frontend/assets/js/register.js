import { AuthAPI } from './api.js';
import {
    loadCountries,
    loadStates,
    loadCities
} from './location.js';

const $ = (id) => document.getElementById(id);

const nameEl = $('name');
const emailEl = $('email');
const emailStatus = $('emailStatus');
const sendOtpBtn = $('sendOtp');
const loginPrompt = $('loginPrompt');

const otpSection = $('otpSection');
const otpEl = $('otp');
const verifyOtpBtn = $('verifyOtp');

const otpInputs = [
    ...document.querySelectorAll('#registerOtpBoxes .otp-digit')
];

const detailsSection = $('detailsSection');
const genderEl = $('gender');
const countryEl = $('country');
const stateEl = $('state');
const cityEl = $('city');
const registerBtn = $('registerBtn');

const msg = $('msg');

let emailTimer = null;
let checkSequence = 0;
let checkedEmail = '';
let otpEmail = '';
let verifiedEmail = '';

let checkingEmail = false;
let sendingOtp = false;
let verifyingOtp = false;
let registering = false;

const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function showMessage(message, isError = false) {
    msg.textContent = message;
    msg.style.color = isError
        ? 'var(--error)'
        : 'var(--success)';
}

function syncOtpValue() {
    otpEl.value = otpInputs.map((input) => input.value).join('');
}

function clearOtpBoxes() {
    otpInputs.forEach((input) => {
        input.value = '';
    });

    syncOtpValue();
}

function focusOtpInput() {
    const firstEmpty = otpInputs.find((input) => !input.value);

    if (firstEmpty) {
        firstEmpty.focus();
    } else {
        otpInputs[otpInputs.length - 1]?.focus();
    }
}

function resetEmailFlow() {
    checkedEmail = '';
    otpEmail = '';
    verifiedEmail = '';

    checkingEmail = false;
    sendingOtp = false;
    verifyingOtp = false;

    sendOtpBtn.hidden = true;
    sendOtpBtn.disabled = true;
    loginPrompt.hidden = true;

    otpSection.hidden = true;
    detailsSection.hidden = true;

    clearOtpBoxes();

    emailStatus.textContent = '';
    msg.textContent = '';

    countryEl.innerHTML =
        '<option value="">Select Country</option>';

    stateEl.innerHTML =
        '<option value="">Select State</option>';

    cityEl.innerHTML =
        '<option value="">Select City</option>';

    stateEl.disabled = true;
    cityEl.disabled = true;
}

// ========================================
// STEP 1: CHECK EMAIL
// ========================================

emailEl.addEventListener('input', () => {
    clearTimeout(emailTimer);

    const sequence = ++checkSequence;

    resetEmailFlow();

    const email = emailEl.value.trim();

    if (!email) return;

    if (!isValidEmail(email)) {
        emailStatus.textContent =
            'Please enter a valid email address.';
        return;
    }

    emailStatus.textContent = 'Checking email...';

    emailTimer = setTimeout(async () => {
        checkingEmail = true;

        try {
            const response = await AuthAPI.checkEmail(email);

            // Ignore stale responses if the email has changed.
            if (
                sequence !== checkSequence ||
                email !== emailEl.value.trim()
            ) {
                return;
            }

            const result = response?.data ?? response;

            checkedEmail = email;

            if (result.registered === true) {
                emailStatus.textContent =
                    'Email is already registered.';

                loginPrompt.hidden = false;
            } else if (result.registered === false) {
                emailStatus.textContent = 'Email is available.';

                sendOtpBtn.hidden = false;
                sendOtpBtn.disabled = false;
            } else {
                checkedEmail = '';

                emailStatus.textContent =
                    'Unexpected email-check response. Please try again.';
            }
        } catch (error) {
            if (sequence === checkSequence) {
                emailStatus.textContent =
                    error.message ||
                    'Could not check email. Please retry.';
            }
        } finally {
            if (sequence === checkSequence) {
                checkingEmail = false;
            }
        }
    }, 500);
});

// ========================================
// STEP 2: SEND REGISTRATION OTP
// ========================================

sendOtpBtn.addEventListener('click', async () => {
    const email = emailEl.value.trim();

    if (!nameEl.value.trim()) {
        showMessage('Please enter your full name.', true);
        nameEl.focus();
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', true);
        emailEl.focus();
        return;
    }

    if (checkingEmail || checkedEmail !== email) {
        showMessage(
            'Please wait for the email check to finish.',
            true
        );
        return;
    }

    if (sendingOtp) return;

    sendingOtp = true;
    sendOtpBtn.disabled = true;

    showMessage('Sending OTP...');

    try {
        await AuthAPI.sendRegOtp(email);

        // Do not continue if the email changed during the request.
        if (email !== emailEl.value.trim()) {
            showMessage(
                'Email changed. Please check it and send OTP again.',
                true
            );
            return;
        }

        otpEmail = email;

        clearOtpBoxes();
        otpSection.hidden = false;

        emailStatus.textContent =
            'OTP sent. Please check your email.';

        showMessage('OTP sent successfully.');

        focusOtpInput();
    } catch (error) {
        showMessage(
            error.message || 'Failed to send OTP.',
            true
        );
    } finally {
        sendingOtp = false;

        if (checkedEmail === emailEl.value.trim()) {
            sendOtpBtn.disabled = false;
        }
    }
});

// ========================================
// SIX-DIGIT OTP INPUT HANDLING
// ========================================

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (event) => {
        const digits = event.target.value
            .replace(/\D/g, '')
            .slice(0, otpInputs.length);

        // Support autofill or multi-digit input.
        if (digits.length > 1) {
            otpInputs.forEach((box, boxIndex) => {
                box.value = digits[boxIndex] || '';
            });

            syncOtpValue();

            const nextEmpty = otpInputs.find(
                (box) => !box.value
            );

            if (nextEmpty) {
                nextEmpty.focus();
            } else {
                otpInputs[otpInputs.length - 1]?.focus();
            }

            return;
        }

        input.value = digits;

        syncOtpValue();

        if (digits && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace') {
            event.preventDefault();

            if (input.value) {
                input.value = '';
            } else if (index > 0) {
                otpInputs[index - 1].value = '';
                otpInputs[index - 1].focus();
            }

            syncOtpValue();
        }

        if (event.key === 'ArrowLeft' && index > 0) {
            event.preventDefault();
            otpInputs[index - 1].focus();
        }

        if (
            event.key === 'ArrowRight' &&
            index < otpInputs.length - 1
        ) {
            event.preventDefault();
            otpInputs[index + 1].focus();
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            verifyOtpBtn.click();
        }
    });

    input.addEventListener('paste', (event) => {
        event.preventDefault();

        const digits = event.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, otpInputs.length);

        otpInputs.forEach((box, boxIndex) => {
            box.value = digits[boxIndex] || '';
        });

        syncOtpValue();

        const nextEmpty = otpInputs.find(
            (box) => !box.value
        );

        if (nextEmpty) {
            nextEmpty.focus();
        } else {
            otpInputs[otpInputs.length - 1]?.focus();
        }
    });
});

// ========================================
// STEP 3: VERIFY OTP
// ========================================

verifyOtpBtn.addEventListener('click', async () => {
    const email = emailEl.value.trim();
    const otp = otpEl.value.trim();

    if (!otpEmail || email !== otpEmail) {
        showMessage(
            'Email changed. Please check it and send OTP again.',
            true
        );
        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        showMessage('Please enter the 6-digit OTP.', true);
        focusOtpInput();
        return;
    }

    if (verifyingOtp) return;

    verifyingOtp = true;
    verifyOtpBtn.disabled = true;

    showMessage('Verifying OTP...');

    try {
        await AuthAPI.verifyRegOtp(email, otp);

        // Prevent accepting a verification result for an old email.
        if (email !== emailEl.value.trim()) {
            showMessage(
                'Email changed. Please verify the new email.',
                true
            );
            return;
        }

        verifiedEmail = email;

        otpSection.hidden = true;
        detailsSection.hidden = false;

        await loadCountries(countryEl);

        showMessage(
            'Email verified. Complete your details.'
        );
    } catch (error) {
        showMessage(
            error.message || 'OTP verification failed.',
            true
        );
    } finally {
        verifyingOtp = false;
        verifyOtpBtn.disabled = false;
    }
});

// ========================================
// STEP 4: LOAD STATES
// ========================================

countryEl.addEventListener('change', async () => {
    stateEl.innerHTML =
        '<option value="">Select State</option>';

    cityEl.innerHTML =
        '<option value="">Select City</option>';

    stateEl.disabled = true;
    cityEl.disabled = true;

    if (!countryEl.value) return;

    try {
        await loadStates(countryEl.value, stateEl);
    } catch (error) {
        showMessage(
            error.message || 'Could not load states.',
            true
        );
    }
});

// ========================================
// STEP 5: LOAD CITIES
// ========================================

stateEl.addEventListener('change', async () => {
    cityEl.innerHTML =
        '<option value="">Select City</option>';

    cityEl.disabled = true;

    if (!stateEl.value) return;

    try {
        await loadCities(stateEl.value, cityEl);
    } catch (error) {
        showMessage(
            error.message || 'Could not load cities.',
            true
        );
    }
});

// ========================================
// STEP 6: REGISTER ACCOUNT
// ========================================

registerBtn.addEventListener('click', async () => {
    const email = emailEl.value.trim();

    if (!verifiedEmail || email !== verifiedEmail) {
        showMessage('Please verify your email first.', true);
        return;
    }

    if (!nameEl.value.trim()) {
        showMessage('Please enter your full name.', true);
        nameEl.focus();
        return;
    }

    if (
        !genderEl.value ||
        !countryEl.value ||
        !stateEl.value ||
        !cityEl.value
    ) {
        showMessage('Please complete all the fields.', true);
        return;
    }

    if (registering) return;

    const payload = {
        name: nameEl.value.trim(),
        email,
        gender: genderEl.value,
        countryId: Number(countryEl.value),
        stateId: Number(stateEl.value),
        cityId: Number(cityEl.value)
    };

    registering = true;
    registerBtn.disabled = true;

    showMessage('Creating your account...');

    try {
        const result = await AuthAPI.register(payload);

        if (!result?.accessToken) {
            throw new Error(
                'Registration response did not contain an access token.'
            );
        }

        localStorage.setItem(
            'zentalk_token',
            result.accessToken
        );

        localStorage.setItem(
            'zentalk_user',
            JSON.stringify(result.user ?? {})
        );

        showMessage(
            'Registration successful. Redirecting...'
        );

        window.location.href = 'dashboard.html';
    } catch (error) {
        showMessage(
            error.message || 'Registration failed.',
            true
        );
    } finally {
        registering = false;
        registerBtn.disabled = false;
    }
});
