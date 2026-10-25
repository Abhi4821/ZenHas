import { ProfileAPI } from "./api.js";
import {  AUDIO_BASE_URL, AUDIO_FRONTEND_URL } from "./api.js";

const token = localStorage.getItem("zentalk_token");



const profileIcon = document.getElementById("profileIcon");
const profileName = document.getElementById("profileName");
const dashboardMsg = document.getElementById("dashboardMsg");
const aiChatCard = document.getElementById("aiChatCard");

const openProfileBtn = document.getElementById("openProfile");
const closeProfileBtn = document.getElementById("closeProfile");
const profileDrawer = document.getElementById("profileDrawer");
const profileOverlay = document.getElementById("profileOverlay");
const profileFrame = document.getElementById("profileFrame");

const DEFAULT_PROFILE_IMAGE = "https://i.pravatar.cc/100";
const AI_CHAT_URL = "../ai-chat-frontend/ai.html";

let profileFrameLoaded = false;
let profileThemeSyncAttached = false;

// ========================================
// AUTHENTICATION
// ========================================

async function validateSession() {
    const savedToken = localStorage.getItem("zentalk_token");

    // Token missing hai
    if (!savedToken) {
        redirectToLogin();
        return;
    }

    try {
        // Backend se actual user verify karo
        const response = await ProfileAPI.get();

        const profile = response?.data ?? response;

        // Database mein user nahi mila
        if (!profile || !profile.email) {
            redirectToLogin();
            return;
        }

        // Token aur user valid hain
        initializeDashboard();

    } catch (error) {
        console.error("Session validation failed:", error);

        // Server ne authentication reject ki
        redirectToLogin();
    }
}

function redirectToLogin() {
    localStorage.removeItem("zentalk_token");
    localStorage.removeItem("zentalk_user");
    window.location.replace("./login.html");
}

validateSession();

function initializeDashboard() {
    loadSavedProfile();
    setupProfileImageFallback();
    setupAIChatNavigation();
    setupProfileDrawer();
    loadProfileIcon();
}

// ========================================
// LOAD SAVED PROFILE
// ========================================

function loadSavedProfile() {
    try {
        const savedUser = JSON.parse(
            localStorage.getItem("zentalk_user") || "{}"
        );

        if (savedUser.name && profileName) {
            profileName.textContent = savedUser.name;
        }

        if (savedUser.profilePhotoUrl && profileIcon) {
            profileIcon.src = savedUser.profilePhotoUrl;
        }
    } catch (error) {
        console.warn("Saved user data is invalid.", error);
    }
}

// ========================================
// PROFILE IMAGE FALLBACK
// ========================================

function setupProfileImageFallback() {
    if (!profileIcon) return;

    profileIcon.onerror = () => {
        profileIcon.onerror = null;
        profileIcon.src = DEFAULT_PROFILE_IMAGE;
    };
}

// ========================================
// FETCH LATEST PROFILE
// ========================================

async function loadProfileIcon() {
    try {
        const response = await ProfileAPI.get();
        const profile = response?.data ?? response;

        if (!profile) {
            throw new Error("Profile data not found.");
        }

        if (profile.name && profileName) {
            profileName.textContent = profile.name;
        }

        if (profile.profilePhotoUrl && profileIcon) {
            profileIcon.src = profile.profilePhotoUrl;
        }

        localStorage.setItem(
            "zentalk_user",
            JSON.stringify(profile)
        );
    } catch (error) {
        console.error("Profile API error:", error);

        if (dashboardMsg) {
            dashboardMsg.textContent =
                "Unable to load profile details. Please try again later.";
        }
    }
}

// ========================================
// PROFILE DRAWER SETUP
// ========================================

function setupProfileDrawer() {
    if (
        !openProfileBtn ||
        !closeProfileBtn ||
        !profileDrawer ||
        !profileOverlay ||
        !profileFrame
    ) {
        console.error(
            "Profile drawer elements missing. Check dashboard.html."
        );
        return;
    }

    openProfileBtn.addEventListener("click", openProfileDrawer);

    closeProfileBtn.addEventListener("click", closeProfileDrawer);

    profileOverlay.addEventListener("click", closeProfileDrawer);

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            profileDrawer.classList.contains("is-open")
        ) {
            closeProfileDrawer();
        }
    });

    window.addEventListener("message", (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === "PROFILE_DRAWER_CLOSE") {
            closeProfileDrawer();
        }
    });

    window.addEventListener("pageshow", () => {
        if (!localStorage.getItem("zentalk_token")) {
            closeProfileDrawer();
            window.location.replace("./login.html");
        }
    });

}

// ========================================
// OPEN PROFILE DRAWER
// ========================================

function openProfileDrawer() {
    if (
        !profileDrawer ||
        !profileOverlay ||
        !profileFrame ||
        !openProfileBtn
    ) {
        return;
    }

    // Open drawer without navigating away from the dashboard.
    profileDrawer.classList.add("is-open");
    profileOverlay.classList.add("is-open");

    profileDrawer.setAttribute("aria-hidden", "false");
    profileOverlay.setAttribute("aria-hidden", "false");

    profileDrawer.removeAttribute("inert");

    openProfileBtn.setAttribute("aria-expanded", "true");

    document.body.classList.add("profile-drawer-open");

    // Load profile page only once.
    if (!profileFrameLoaded) {
        profileFrame.addEventListener(
            "load",
            handleProfileFrameLoad,
            { once: true }
        );

        profileFrame.src = "./profile.html";
        profileFrameLoaded = true;
    } else {
        syncProfileTheme();
        setupProfileThemeSync();
    }

    closeProfileBtn?.focus();
}

// ========================================
// PROFILE IFRAME LOAD
// ========================================

function handleProfileFrameLoad() {
    syncProfileTheme();
    setupProfileThemeSync();
}

// ========================================
// SYNCHRONIZE THEME
// ========================================

function getCurrentTheme() {
    return (
        document.documentElement.getAttribute("data-theme") ||
        localStorage.getItem("zentalk_theme") ||
        "light"
    );
}

function applyDashboardTheme(theme) {
    if (theme !== "light" && theme !== "dark") return;

    document.documentElement.setAttribute("data-theme", theme);

    try {
        localStorage.setItem("zentalk_theme", theme);
    } catch (error) {
        console.warn("Could not save theme preference.", error);
    }
}

function syncProfileTheme() {
    try {
        const frameDoc = profileFrame?.contentDocument;

        if (!frameDoc) return;

        const theme = getCurrentTheme();

        frameDoc.documentElement.setAttribute("data-theme", theme);

        // Keep the iframe theme preference consistent.
        try {
            profileFrame.contentWindow.localStorage.setItem(
                "zentalk_theme",
                theme
            );
        } catch (error) {
            console.warn("Could not sync stored profile theme.", error);
        }
    } catch (error) {
        console.error("Could not sync profile theme:", error);
    }
}

// ========================================
// PROFILE THEME TOGGLE SYNC
// ========================================

function setupProfileThemeSync() {
    try {
        const frameDoc = profileFrame?.contentDocument;

        if (!frameDoc || profileThemeSyncAttached) return;

        const toggle = frameDoc.querySelector("[data-theme-toggle]");

        if (!toggle) {
            console.warn("Profile theme toggle not found.");
            return;
        }

        profileThemeSyncAttached = true;

        toggle.addEventListener("click", () => {
            // Let profile's own theme.js handle the toggle first.
            setTimeout(() => {
                try {
                    const theme =
                        frameDoc.documentElement.getAttribute("data-theme");

                    if (theme === "light" || theme === "dark") {
                        applyDashboardTheme(theme);
                        syncProfileTheme();
                    }
                } catch (error) {
                    console.error("Theme toggle sync failed:", error);
                }
            }, 100);
        });
    } catch (error) {
        console.error("Could not set up profile theme sync:", error);
    }
}

// ========================================
// CLOSE PROFILE DRAWER
// ========================================

// function closeProfileDrawer() {
//     if (
//         !profileDrawer ||
//         !profileOverlay ||
//         !openProfileBtn
//     ) {
//         return;
//     }

//     profileDrawer.classList.remove("is-open");
//     profileOverlay.classList.remove("is-open");

//     profileDrawer.setAttribute("aria-hidden", "true");
//     profileOverlay.setAttribute("aria-hidden", "true");

//     profileDrawer.setAttribute("inert", "");

//     openProfileBtn.setAttribute("aria-expanded", "false");

//     document.body.classList.remove("profile-drawer-open");

//     openProfileBtn.focus();
// }


function closeProfileDrawer() {
    if (!profileDrawer || !profileOverlay || !profileFrame) {
        return;
    }

    profileDrawer.classList.remove("is-open");
    profileOverlay.classList.remove("is-open");

    profileDrawer.setAttribute("aria-hidden", "true");
    profileOverlay.setAttribute("aria-hidden", "true");
    profileDrawer.setAttribute("inert", "");

    openProfileBtn?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("profile-drawer-open");

    // Reset the iframe so another page cannot remain visible.
    profileFrame.src = "about:blank";
    profileFrameLoaded = false;
    profileThemeSyncAttached = false;

    closeProfileBtn?.blur();
}

// ========================================
// AI CHAT NAVIGATION
// ========================================

function setupAIChatNavigation() {
    if (!aiChatCard) return;

    function openAIChat() {
        const savedToken = localStorage.getItem("zentalk_token");

        if (!savedToken) {
            window.location.href = "./login.html";
            return;
        }

        window.location.href = AI_CHAT_URL;
    }

    aiChatCard.addEventListener("click", openAIChat);

    aiChatCard.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openAIChat();
        }
    });
}

// ========================================
// AUDIO / VIDEO CALL PLACEHOLDER
// ========================================

window.go = function (port, type) {
    const savedToken = localStorage.getItem("zentalk_token");

    if (!savedToken) {
        window.location.href = "./login.html";
        return;
    }

    alert(
        type +
        " frontend abhi setup hona baaki hai. Port: " +
        port
    );
};






// async function openAudioService() {
//     const token = localStorage.getItem("zentalk_token");

//     if (!token) {
//         window.location.href = "./login.html";
//         return;
//     }

//     try {
//         const response = await fetch("http://localhost:8082/api/v1/rooms/enter", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Content-Type": "application/json"
//             }
//         });
//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error("Status:", response.status);
//             console.error("Backend error:", errorText);
//             alert(`Error ${response.status}: ${errorText}`);
//             return;
//         }

//         window.location.href = "http://127.0.0.1:5501/audio-frontend/index.html";
//     } catch (error) {
//         console.error("Audio queue error:", error);
//         alert(error.message || "Audio service open nahi ho payi.");
//     }
// }

// async function openAudioService() {
//     const token = localStorage.getItem("zentalk_token");
//     if (!token) {
//         window.location.href = "./login.html";
//         return;
//     }
//     try {
//         const response = await fetch(`${AUDIO_BASE_URL}/rooms/enter`, {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${token}`,
//                 "Content-Type": "application/json"
//             }
//         });
//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error("Status:", response.status);
//             console.error("Backend error:", errorText);
//             alert(`Error ${response.status}: ${errorText}`);
//             return;
//         }
//         console.log("Room enter success");
//         window.location.href = AUDIO_FRONTEND_URL;
//     } catch (error) {
//         console.error("Audio queue error:", error);
//         alert(error.message || "Audio service open nahi ho payi.");
//     }
// }
async function openAudioService() {
    const token = localStorage.getItem("zentalk_token");
    if (!token) {
        window.location.href = "./login.html";
        return;
    }
    try {
        const response = await fetch(`${AUDIO_BASE_URL}/rooms/enter`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        // 409 matlab already in queue - ye error nahi hai
        if (response.status === 409) {
            console.log("Already in queue, opening audio...");
            window.location.href = AUDIO_FRONTEND_URL;
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Status:", response.status, errorText);
            // 409 ke alawa error ho to hi alert
            if (response.status !== 409) {
                alert(`Error: ${JSON.parse(errorText).message || errorText}`);
            } else {
                window.location.href = AUDIO_FRONTEND_URL;
            }
            return;
        }

        console.log("Room enter success");
        window.location.href = AUDIO_FRONTEND_URL;
    } catch (error) {
        console.error("Audio queue error:", error);
        alert(error.message || "Audio service open nahi ho payi.");
    }
}

const audioCallCard = document.getElementById("audioCallCard");
if (audioCallCard) {
    audioCallCard.addEventListener("click", openAudioService);
}




if (audioCallCard) {
    audioCallCard.addEventListener("click", openAudioService);

    audioCallCard.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openAudioService();
        }
    });
}
