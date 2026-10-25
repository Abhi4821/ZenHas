"use strict";

window.AudioAuth = (() => {
    const TOKEN_KEY = "zentalk_token";

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function requireToken() {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Authentication token nahi mila. Pehle login karein."
            );
        }

        return token;
    }

    function isAuthenticated() {
        return Boolean(getToken());
    }

    function getTokenPayload() {
        try {
            const token = getToken();
            if (!token) return null;

            const parts = token.split(".");
            if (parts.length !== 3) return null;

            let payload = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            payload += "=".repeat((4 - payload.length % 4) % 4);

            return JSON.parse(atob(payload));
        } catch (error) {
            console.warn("JWT payload read nahi ho saka:", error);
            return null;
        }
    }

    function getCurrentUserId() {
        const payload = getTokenPayload();
        if (!payload) return null;

        const idKeys = [
            "userId",
            "user_id",
            "id",
            "sub"
        ];

        for (const key of idKeys) {
            const value = payload[key];

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return String(value);
            }
        }

        return null;
    }

    return {
        getToken,
        requireToken,
        isAuthenticated,
        getCurrentUserId,
        getTokenPayload
    };
})();
