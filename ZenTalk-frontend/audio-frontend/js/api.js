"use strict";

// const API_BASE_URL = "http://localhost:8082";
// const API_BASE_URL = "http://localhost:8082";
const API_BASE_URL = "http://192.168.1.83:8082";


async function apiRequest(path, options = {}) {
    const token = window.AudioAuth.requireToken();

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new Error(
            typeof data === "string"
                ? data || `Request failed: ${response.status}`
                : data.message || `Request failed: ${response.status}`
        );
    }

    return data;
}

window.AudioAPI = {
    getSnapshot: () => apiRequest("/api/v1/rooms/snapshot"),

    enterQueue: () =>
        apiRequest("/api/v1/rooms/enter", { method: "POST" }),

    exitQueue: () =>
        apiRequest("/api/v1/rooms/exit", { method: "POST" }),

    connect: (targetUserId) =>
        apiRequest("/api/v1/rooms/connect", {
            method: "POST",
            body: JSON.stringify({ targetUserId })
        }),

    accept: (requestId) =>
        apiRequest(`/api/v1/rooms/accept/${encodeURIComponent(requestId)}`, {
            method: "POST"
        }),

    reject: (requestId) =>
        apiRequest(`/api/v1/rooms/reject/${encodeURIComponent(requestId)}`, {
            method: "POST"
        }),

    cancel: (requestId) =>
        apiRequest(`/api/v1/rooms/cancel/${encodeURIComponent(requestId)}`, {
            method: "POST"
        }),



    endCall: (roomId, reason = "USER_ENDED") =>
    apiRequest("/api/v1/call/end", {
        method: "POST",
        body: JSON.stringify({
            roomId: roomId,
            reason: reason
        })
    })
};


// export const AUTH_SERVICE_URL = "http://192.168.1.83:8081";
// export const AUDIO_SERVICE_URL = "http://192.168.1.83:8082";
// export const AUDIO_FRONTEND_URL = "http://192.168.1.83:5501/audio-frontend/index.html";

// export const BASE_URL = `${AUTH_SERVICE_URL}/api/v1`;
// export const AUDIO_BASE_URL = `${AUDIO_SERVICE_URL}/api/v1`;

// export async function apiFetch(path, { method = "GET", body, auth = false, isForm = false } = {}) {
//     const headers = {};
//     if (!isForm) headers["Content-Type"] = "application/json";
//     if (auth) {
//         const token = localStorage.getItem("zentalk_token");
//         if (token) headers["Authorization"] = `Bearer ${token}`;
//     }
//     const response = await fetch(`${BASE_URL}${path}`, { method, headers, body: body == null ? undefined : isForm ? body : JSON.stringify(body) });
//     const json = await response.json().catch(() => ({}));
//     if (!response.ok) throw new Error(json.message || `Request failed (${response.status})`);
//     return json.data !== undefined ? json.data : json;
// }

// export const AuthAPI = {
//     checkEmail: (email) => apiFetch("/auth/check-email", { method: "POST", body: { email } }),
//     sendLoginOtp: (email) => apiFetch("/auth/login/send-otp", { method: "POST", body: { email } }),
//     verifyLoginOtp: (email, otp) => apiFetch("/auth/login/verify-otp", { method: "POST", body: { email, otp } }),
//     register: (data) => apiFetch("/auth/register", { method: "POST", body: data }),
//     logout: () => apiFetch("/auth/logout", { method: "POST", auth: true, body: {} })
// };
// export const ProfileAPI = {
//     get: () => apiFetch("/profile", { auth: true }),
//     update: (data) => apiFetch("/profile", { method: "PUT", auth: true, body: data }),
//     photo: (file) => {
//         const fd = new FormData(); fd.append("photo", file);
//         return apiFetch("/profile/photo", { method: "POST", auth: true, body: fd, isForm: true });
//     }
// };
// export const AccountAPI = {
//     sendDeleteOtp: () => apiFetch("/account/delete/send-otp", { method: "POST", auth: true, body: {} }),
//     verifyDeleteOtp: (email, otp) => apiFetch("/account/delete/verify-otp", { method: "POST", auth: true, body: { email, otp } }),
//     delete: () => apiFetch("/account", { method: "DELETE", auth: true })
// };
// export const LocationAPI = {
//     countries: () => apiFetch("/locations/countries"),
//     states: (countryId) => apiFetch(`/locations/countries/${countryId}/states`),
//     cities: (stateId) => apiFetch(`/locations/states/${stateId}/cities`)
// };