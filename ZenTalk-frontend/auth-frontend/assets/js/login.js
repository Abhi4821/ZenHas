
import { AuthAPI } from "./api.js";

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("email");
const otpEl = document.getElementById("otp");
const otpSec = document.getElementById("otpSec");
const sendBtn = document.getElementById("btn1");
const verifyBtn = document.getElementById("btn2");
const resendBtn = document.getElementById("resend");
const msg = document.getElementById("msg");

const otpDigits = [
    ...document.querySelectorAll(".otp-digit")
];

let requestInProgress = false;
let otpSent = false;
let otpEmail = "";

/* Display messages using theme.css color variables */
function showMessage(message, type = "info") {
    msg.textContent = message;

    const messageColors = {
        success: "var(--success)",
        error: "var(--error)",
        info: "var(--info)"
    };

    msg.style.color = messageColors[type] || "var(--info)";
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setBusy(button, busy, busyText, normalText) {
    button.disabled = busy;
    button.textContent = busy ? busyText : normalText;
}

/* Combine the six OTP boxes into one six-digit value */
function getOtpValue() {
    return otpDigits.map(input => input.value).join("");
}

function syncOtpValue() {
    otpEl.value = getOtpValue();
}

function clearOtp() {
    otpDigits.forEach(input => {
        input.value = "";
    });

    syncOtpValue();
}

function focusFirstOtpBox() {
    if (otpDigits.length > 0) {
        otpDigits[0].focus();
    }
}

function focusFirstEmptyOtpBox() {
    const index = otpDigits.findIndex(input => !input.value);

    if (index !== -1) {
        otpDigits[index].focus();
    } else if (otpDigits.length > 0) {
        otpDigits[otpDigits.length - 1].focus();
    }
}

/* Send or resend the login OTP */
async function sendOtp(resend = false) {
    if (requestInProgress) return;

    const email = emailEl.value.trim().toLowerCase();

    if (!validEmail(email)) {
        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailEl.focus();
        return;
    }

    if (resend && (!otpSent || email !== otpEmail)) {
        showMessage(
            "Please request a login OTP for this email first.",
            "error"
        );
        return;
    }

    requestInProgress = true;

    setBusy(
        resend ? resendBtn : sendBtn,
        true,
        "Please wait...",
        resend ? "Resend OTP" : "Send OTP"
    );

    try {
        if (!resend) {
            showMessage("Checking your account...", "info");

            const check = await AuthAPI.checkEmail(email);
            const result = check?.data ?? check;

            if (typeof result?.registered !== "boolean") {
                throw new Error(
                    "Unable to verify this email right now. Please try again."
                );
            }

            if (!result.registered) {
                otpSent = false;
                otpEmail = "";
                otpSec.hidden = true;
                clearOtp();

                showMessage(
                    "This email is not registered. Please create an account first.",
                    "error"
                );

                return;
            }
        }

        showMessage(
            resend
                ? "Sending a new login OTP..."
                : "Email registered. Sending login OTP...",
            "info"
        );

        await AuthAPI.sendLoginOtp(email);

        otpSent = true;
        otpEmail = email;

        otpSec.hidden = false;
        clearOtp();

        showMessage(
            resend
                ? "A new login OTP has been sent. Please check your inbox."
                : "Login OTP sent successfully. Please check your inbox.",
            "success"
        );

        focusFirstOtpBox();
    } catch (error) {
        showMessage(
            error.message ||
                "Unable to send the login OTP. Please try again.",
            "error"
        );
    } finally {
        requestInProgress = false;

        setBusy(sendBtn, false, "Please wait...", "Send OTP");
        setBusy(resendBtn, false, "Please wait...", "Resend OTP");
    }
}

/* Verify OTP and log in */
async function verifyOtp() {
    if (requestInProgress) return;

    const email = emailEl.value.trim().toLowerCase();
    const otp = getOtpValue();

    syncOtpValue();

    if (!validEmail(email)) {
        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailEl.focus();
        return;
    }

    if (!otpSent || email !== otpEmail) {
        showMessage(
            "Please request a login OTP for this email first.",
            "error"
        );
        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        showMessage(
            "Please enter the complete 6-digit OTP.",
            "error"
        );

        focusFirstEmptyOtpBox();
        return;
    }

    requestInProgress = true;

    setBusy(
        verifyBtn,
        true,
        "Verifying...",
        "Verify & Login"
    );

    try {
        showMessage("Verifying your login OTP...", "info");

        const response = await AuthAPI.verifyLoginOtp(email, otp);
        const result = response?.data ?? response;

        const accessToken = result?.accessToken;
        const user = result?.user;

        if (
            typeof accessToken !== "string" ||
            !accessToken.trim()
        ) {
            throw new Error(
                "The server did not return an access token. Please try again."
            );
        }

        localStorage.setItem("zentalk_token", accessToken);

        if (user) {
            localStorage.setItem(
                "zentalk_user",
                JSON.stringify(user)
            );
        } else {
            localStorage.removeItem("zentalk_user");
        }

        showMessage(
            "Login successful. Redirecting to your dashboard...",
            "success"
        );

        window.location.replace("dashboard.html");
    } catch (error) {
        showMessage(
            error.message ||
                "OTP verification failed. Please check the code and try again.",
            "error"
        );
    } finally {
        requestInProgress = false;

        setBusy(
            verifyBtn,
            false,
            "Verifying...",
            "Verify & Login"
        );
    }
}

/* Handle typing, automatic focus, backspace, arrows and paste */
otpDigits.forEach((input, index) => {
    input.addEventListener("input", event => {
        const digits = event.target.value
            .replace(/\D/g, "")
            .slice(0, otpDigits.length);

        if (digits.length > 1) {
            // Supports OTP autofill into the first box.
            otpDigits.forEach((digitInput, digitIndex) => {
                digitInput.value = digits[digitIndex] || "";
            });

            focusFirstEmptyOtpBox();
        } else {
            input.value = digits;

            if (digits && index < otpDigits.length - 1) {
                otpDigits[index + 1].focus();
            }
        }

        syncOtpValue();
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Backspace") {
            event.preventDefault();

            if (input.value) {
                input.value = "";
            } else if (index > 0) {
                otpDigits[index - 1].value = "";
                otpDigits[index - 1].focus();
            }

            syncOtpValue();
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            otpDigits[index - 1].focus();
        }

        if (
            event.key === "ArrowRight" &&
            index < otpDigits.length - 1
        ) {
            event.preventDefault();
            otpDigits[index + 1].focus();
        }

        if (event.key === "Enter") {
            event.preventDefault();
            verifyOtp();
        }
    });

    input.addEventListener("paste", event => {
        event.preventDefault();

        const pastedDigits = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, otpDigits.length);

        otpDigits.forEach((digitInput, digitIndex) => {
            digitInput.value = pastedDigits[digitIndex] || "";
        });

        syncOtpValue();
        focusFirstEmptyOtpBox();
    });
});

/* Login form */
form.addEventListener("submit", event => {
    event.preventDefault();
    sendOtp(false);
});

/* Verify and resend buttons */
verifyBtn.addEventListener("click", verifyOtp);

resendBtn.addEventListener("click", () => {
    sendOtp(true);
});

/* Invalidate the old OTP when the email changes */
emailEl.addEventListener("input", () => {
    const currentEmail = emailEl.value.trim().toLowerCase();

    if (otpSent && currentEmail !== otpEmail) {
        otpSent = false;
        otpEmail = "";

        otpSec.hidden = true;
        clearOtp();

        showMessage(
            "Email changed. Please request a new login OTP.",
            "info"
        );
    }
});


/* ========================================
   REGISTER PAGE — OTP BOX HANDLING
======================================== */

const registerOtpInputs = [
    ...document.querySelectorAll(
        "#registerOtpBoxes .otp-digit"
    )
];

const registerOtpHiddenInput =
    document.getElementById("otp");

function syncRegisterOtp() {
    if (!registerOtpHiddenInput) return;

    registerOtpHiddenInput.value = registerOtpInputs
        .map(input => input.value)
        .join("");
}

function clearRegisterOtp() {
    registerOtpInputs.forEach(input => {
        input.value = "";
    });

    syncRegisterOtp();
}

function focusRegisterOtp() {
    const firstEmpty = registerOtpInputs.find(
        input => !input.value
    );

    if (firstEmpty) {
        firstEmpty.focus();
    } else {
        registerOtpInputs[registerOtpInputs.length - 1]?.focus();
    }
}

registerOtpInputs.forEach((input, index) => {
    input.addEventListener("input", event => {
        const digits = event.target.value
            .replace(/\D/g, "")
            .slice(0, registerOtpInputs.length);

        if (digits.length > 1) {
            registerOtpInputs.forEach((box, boxIndex) => {
                box.value = digits[boxIndex] || "";
            });

            syncRegisterOtp();
            focusRegisterOtp();
            return;
        }

        input.value = digits;
        syncRegisterOtp();

        if (digits && index < registerOtpInputs.length - 1) {
            registerOtpInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Backspace") {
            event.preventDefault();

            if (input.value) {
                input.value = "";
            } else if (index > 0) {
                registerOtpInputs[index - 1].value = "";
                registerOtpInputs[index - 1].focus();
            }

            syncRegisterOtp();
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            registerOtpInputs[index - 1].focus();
        }

        if (
            event.key === "ArrowRight" &&
            index < registerOtpInputs.length - 1
        ) {
            event.preventDefault();
            registerOtpInputs[index + 1].focus();
        }

        if (event.key === "Enter") {
            event.preventDefault();

            document.getElementById("verifyOtp")?.click();
        }
    });

    input.addEventListener("paste", event => {
        event.preventDefault();

        const digits = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, registerOtpInputs.length);

        registerOtpInputs.forEach((box, boxIndex) => {
            box.value = digits[boxIndex] || "";
        });

        syncRegisterOtp();
        focusRegisterOtp();
    });
});
