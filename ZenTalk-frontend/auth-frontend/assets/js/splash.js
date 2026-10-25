
"use strict";

const SPLASH_DURATION = 1500;

window.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(() => {
        const token = localStorage.getItem("zentalk_token");

        if (token && token.trim().length > 0) {
            window.location.replace("dashboard.html");
        } else {
            window.location.replace("login.html");
        }
    }, SPLASH_DURATION);
});
