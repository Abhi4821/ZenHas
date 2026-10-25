
"use strict";

window.AudioUtils = (() => {
    const BLOCK_KEY = "audio_blocked_user_ids";

    function getBlockedUserIds() {
        try {
            const ids = JSON.parse(
                localStorage.getItem(BLOCK_KEY) || "[]"
            );

            return Array.isArray(ids) ? ids : [];
        } catch {
            return [];
        }
    }

    function blockUser(userId) {
        if (userId == null) return;

        const id = String(userId);
        const ids = getBlockedUserIds().map(String);

        if (!ids.includes(id)) {
            ids.push(id);
            localStorage.setItem(BLOCK_KEY, JSON.stringify(ids));
        }
    }

    function unblockUser(userId) {
        const id = String(userId);

        const ids = getBlockedUserIds().filter(
            existingId => String(existingId) !== id
        );

        localStorage.setItem(BLOCK_KEY, JSON.stringify(ids));
    }

    function filterBlockedUsers(users) {
        const blockedIds = new Set(
            getBlockedUserIds().map(String)
        );

        return (Array.isArray(users) ? users : []).filter(
            user =>
                user &&
                !blockedIds.has(String(user.userId))
        );
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function parseEvent(body) {
        if (body == null || body === "") {
            return null;
        }

        if (typeof body === "object") {
            return body;
        }

        const text = String(body).trim();

        try {
            return JSON.parse(text);
        } catch {
            const separator = text.indexOf(":");

            if (separator !== -1) {
                return {
                    type: text.substring(0, separator),
                    requestId: text.substring(separator + 1),
                    raw: text
                };
            }

            return {
                type: "RAW",
                message: text,
                raw: text
            };
        }
    }
    return {
        getBlockedUserIds,
        blockUser,
        unblockUser,
        filterBlockedUsers,
        escapeHTML,
        parseEvent
    };
})();
