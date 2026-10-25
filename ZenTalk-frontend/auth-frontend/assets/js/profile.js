
import {
    ProfileAPI,
    AccountAPI,
    AuthAPI,
    AUTH_SERVICE_URL
} from "./api.js";

import { getProfileObject } from "./getProfileObject.js";

const card = document.getElementById("profileCard");

let currentProfile = null;
let busy = false;

function showMessage(message, isError = false) {
    const msg = document.getElementById("profileMsg");
    if (!msg) return;

    msg.textContent = message;
    msg.style.color = isError ? "#dc2626" : "#16803c";
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function navigateToMainPage(page) {
    if (window.parent !== window) {
        window.parent.location.replace(page);
    } else {
        window.location.replace(page);
    }
}

function getProfilePhotoUrl(photoUrl, gender) {
    const path = String(photoUrl ?? "").trim();

    if (!path) {
        return getDefaultPhotoUrl(gender);
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return new URL(path, AUTH_SERVICE_URL).href;
}

function getDefaultPhotoUrl(gender) {
    return String(gender ?? "").toUpperCase() === "FEMALE"
        ? "./assets/images/default-female.png"
        : "./assets/images/default-male.png";
}

async function loadProfile() {
    if (!localStorage.getItem("zentalk_token")) {
        window.location.replace("login.html");
        return;
    }

    card.textContent = "Loading profile...";

    try {
        const response = await ProfileAPI.get();
        const profile = getProfileObject(response);

        if (!profile || !profile.email) {
            throw new Error(
                "The server did not return the expected profile details."
            );
        }

        currentProfile = profile;
        localStorage.setItem("zentalk_user", JSON.stringify(profile));

        renderProfile(profile);
    } catch (error) {
        console.error("Profile loading failed:", error);

        card.innerHTML = `
            <h3>Unable to Load Profile</h3>
            <p id="profileMsg" class="small" role="status"></p>

            <button id="retryProfile" class="btn">
                Retry
            </button>

            <button id="profileLogin" class="btn btn-outline">
                Back to Login
            </button>
        `;

        showMessage(
            error.message || "Unable to load your profile. Please try again.",
            true
        );

        document.getElementById("retryProfile").onclick = loadProfile;

        document.getElementById("profileLogin").onclick = () => {
            window.location.href = "login.html";
        };
    }
}

function renderProfile(profile) {
    const savedPhoto =
        profile.profilePhotoUrl ||
        profile.profilePhoto ||
        profile.photoUrl ||
        profile.photo ||
        "";

    const photoUrl = getProfilePhotoUrl(savedPhoto, profile.gender);

    console.log("Profile data:", profile);
    console.log("Photo path:", savedPhoto);
    console.log("Image URL:", photoUrl);

    const location = [
        profile.country?.name,
        profile.state?.name,
        profile.city?.name
    ].filter(Boolean).join(" / ") || "Not available";

    const communicationTime =
        profile.communicationTime ??
        profile.communicationSeconds ??
        "Not available";

    card.innerHTML = `
        <div class="profile-content">

            <img
                id="profilePhoto"
                src="${escapeAttribute(photoUrl)}"
                alt="Profile photo"
                class="profile-photo"
                style="width:100px;height:100px;border-radius:50%;object-fit:cover;display:block;"
            >

            <h2>${escapeHtml(profile.name || "User")}</h2>
            <p>${escapeHtml(profile.email || "")}</p>
            <p>Gender: ${escapeHtml(profile.gender || "Not specified")}</p>
            <p>Location: ${escapeHtml(location)}</p>
            <p>Profile completion: ${Number(profile.profileCompletion ?? 0)}%</p>
            <p>Communication time: ${escapeHtml(communicationTime)}</p>

            <hr>

            <h3>Edit Profile</h3>

            <label for="editName">Full name</label>
            <input
                id="editName"
                class="input"
                maxlength="100"
                value="${escapeAttribute(profile.name || "")}"
            >

            <label for="editGender">Gender</label>
            <select id="editGender" class="input">
                <option value="MALE" ${profile.gender === "MALE" ? "selected" : ""}>
                    Male
                </option>
                <option value="FEMALE" ${profile.gender === "FEMALE" ? "selected" : ""}>
                    Female
                </option>
                <option value="OTHER" ${profile.gender === "OTHER" ? "selected" : ""}>
                    Other
                </option>
            </select>

            <button id="saveProfile" class="btn">
                Save Changes
            </button>

            <hr>

            <h3>Profile Photo</h3>

            <input
                id="photoFile"
                type="file"
                class="input"
                accept="image/*"
            >

            <button id="uploadPhoto" class="btn btn-outline">
                Upload Photo
            </button>

            <hr>

            <!-- Audio Block List -->
            <h3>Audio Block List</h3>
            <p>Manage the users you have blocked in Audio.</p>

            <button
                id="openBlockList"
                class="btn btn-outline"
                type="button"
            >
                Manage Block List
            </button>

            <div
                id="blockListContainer"
                hidden
                style="margin-top:16px;"
            >
                <button
                    id="closeBlockList"
                    class="btn btn-outline"
                    type="button"
                >
                    Close Block List
                </button>

                <iframe
                    id="blockListFrame"
                    src="http://127.0.0.1:5501/audio-frontend/pages/block-list.html"
                    title="Audio Block List"
                    loading="lazy"
                    style="width:100%;height:500px;border:1px solid #ddd;border-radius:12px;margin-top:12px;"
                ></iframe>
            </div>

            <hr>

            <button id="logoutBtn" class="btn btn-outline">
                Logout
            </button>

            <button id="sendDeleteOtp" class="btn danger">
                Delete Account
            </button>

            <div id="deleteSection" hidden>
                <input
                    id="deleteOtp"
                    class="input"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="Enter verification code"
                >

                <button id="verifyDeleteOtp" class="btn danger">
                    Verify Code and Delete Account
                </button>
            </div>

            <p id="profileMsg" class="small" role="status"></p>
        </div>
    `;

    const image = document.getElementById("profilePhoto");

    image.onload = () => {
        console.log("Image loaded successfully:", image.src);
    };

    image.onerror = () => {
        console.error("Image failed to load:", image.src);
    };

    // Existing profile actions
    document.getElementById("saveProfile").onclick = saveProfile;
    document.getElementById("uploadPhoto").onclick = uploadPhoto;
    document.getElementById("logoutBtn").onclick = logout;
    document.getElementById("sendDeleteOtp").onclick = sendDeleteOtp;
    document.getElementById("verifyDeleteOtp").onclick = verifyAndDelete;

    // Open and close Audio Block List
    const openBlockList = document.getElementById("openBlockList");
    const closeBlockList = document.getElementById("closeBlockList");
    const blockListContainer = document.getElementById("blockListContainer");

    openBlockList.onclick = () => {
        blockListContainer.hidden = false;
        openBlockList.hidden = true;
    };

    closeBlockList.onclick = () => {
        blockListContainer.hidden = true;
        openBlockList.hidden = false;
    };
}

async function saveProfile() {
    if (busy) return;

    const name = document.getElementById("editName").value.trim();
    const gender = document.getElementById("editGender").value;
    const button = document.getElementById("saveProfile");

    if (!name) {
        showMessage("Please enter your full name.", true);
        return;
    }

    busy = true;
    button.disabled = true;
    button.textContent = "Saving...";

    try {
        const response = await ProfileAPI.update({ name, gender });
        const updated = getProfileObject(response);

        if (updated && typeof updated === "object") {
            currentProfile = { ...currentProfile, ...updated };

            localStorage.setItem(
                "zentalk_user",
                JSON.stringify(currentProfile)
            );
        }

        showMessage("Profile updated successfully.");
        await loadProfile();
    } catch (error) {
        console.error("Profile update failed:", error);

        showMessage(
            error.message || "Unable to update your profile.",
            true
        );
    } finally {
        busy = false;

        if (button.isConnected) {
            button.disabled = false;
            button.textContent = "Save Changes";
        }
    }
}

async function uploadPhoto() {
    if (busy) return;

    const fileInput = document.getElementById("photoFile");
    const file = fileInput.files?.[0];
    const button = document.getElementById("uploadPhoto");

    if (!file) {
        showMessage("Please select an image to upload.", true);
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage("Please select a valid image file.", true);
        return;
    }

    busy = true;
    button.disabled = true;
    button.textContent = "Uploading...";

    showMessage("Uploading profile photo...");

    try {
        await ProfileAPI.photo(file);

        const response = await ProfileAPI.get();
        const latest = getProfileObject(response);

        if (!latest || typeof latest !== "object") {
            throw new Error("Unable to refresh profile after upload.");
        }

        currentProfile = latest;

        localStorage.setItem(
            "zentalk_user",
            JSON.stringify(latest)
        );

        renderProfile(latest);
        showMessage("Profile photo uploaded successfully.");
    } catch (error) {
        console.error("Photo upload failed:", error);

        showMessage(
            error.message || "Unable to upload photo.",
            true
        );
    } finally {
        busy = false;

        const uploadButton = document.getElementById("uploadPhoto");

        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent = "Upload Photo";
        }
    }
}

async function logout() {
    if (busy) return;

    busy = true;

    try {
        await AuthAPI.logout();
    } catch (error) {
        console.error("Logout request failed:", error);
    } finally {
        localStorage.removeItem("zentalk_token");
        localStorage.removeItem("zentalk_user");

        navigateToMainPage("./login.html");
    }
}

async function sendDeleteOtp() {
    if (busy) return;

    const button = document.getElementById("sendDeleteOtp");
    const section = document.getElementById("deleteSection");

    if (!button) return;

    busy = true;
    button.disabled = true;
    button.textContent = "Please wait...";

    showMessage("Please wait... Sending verification code.");

    try {
        await AccountAPI.sendDeleteOtp();

        section.hidden = false;

        showMessage("OTP sent successfully. Please check your email.");

        document.getElementById("deleteOtp")?.focus();
    } catch (error) {
        console.error("Sending delete OTP failed:", error);

        showMessage(
            error.message || "Unable to send OTP. Please try again.",
            true
        );
    } finally {
        busy = false;

        if (button.isConnected) {
            button.disabled = false;
            button.textContent = "Delete Account";
        }
    }
}

async function verifyAndDelete() {
    if (busy) return;

    const otp = document.getElementById("deleteOtp").value.trim();

    if (!/^\d{6}$/.test(otp)) {
        showMessage("Please enter the 6-digit verification code.", true);
        return;
    }

    if (!window.confirm(
        "Are you sure you want to permanently delete your account? This action cannot be undone."
    )) {
        return;
    }

    const button = document.getElementById("verifyDeleteOtp");

    busy = true;
    button.disabled = true;
    button.textContent = "Processing...";

    try {
        const email = currentProfile.email;

        await AccountAPI.verifyDeleteOtp(email, otp);
        await AccountAPI.delete();

        localStorage.removeItem("zentalk_token");
        localStorage.removeItem("zentalk_user");

        window.location.replace("register.html");
    } catch (error) {
        console.error("Account deletion failed:", error);

        showMessage(
            error.message || "Unable to delete the account.",
            true
        );
    } finally {
        busy = false;

        if (button.isConnected) {
            button.disabled = false;
            button.textContent = "Verify Code and Delete Account";
        }
    }
}

loadProfile();
