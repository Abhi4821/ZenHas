// const HOST = window.location.hostname;
const HOST = window.location.hostname ;

export const AUTH_SERVICE_URL = `http://${HOST}:8081`;
export const AUDIO_SERVICE_URL = `http://${HOST}:8082`;
export const AUDIO_FRONTEND_URL = `http://${HOST}:5501/audio-frontend/index.html`;

export const BASE_URL = `${AUTH_SERVICE_URL}/api/v1`;
export const AUDIO_BASE_URL = `${AUDIO_SERVICE_URL}/api/v1`;

export async function apiFetch(path, { method = "GET", body, auth = false, isForm = false } = {}) {
    const headers = {};
    if (!isForm) headers["Content-Type"] = "application/json";
    if (auth) {
        const token = localStorage.getItem("zentalk_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${BASE_URL}${path}`, {
        method, headers,
        body: body == null ? undefined : isForm ? body : JSON.stringify(body)
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || `Request failed (${response.status})`);
    return json.data !== undefined ? json.data : json;
}

export const AuthAPI = {
    checkEmail: (email) => apiFetch("/auth/check-email", { method: "POST", body: { email } }),
    sendLoginOtp: (email) => apiFetch("/auth/login/send-otp", { method: "POST", body: { email } }),
    verifyLoginOtp: (email, otp) => apiFetch("/auth/login/verify-otp", { method: "POST", body: { email, otp } }),
    sendRegOtp: (email) => apiFetch("/auth/register/send-otp", { method: "POST", body: { email } }),
    verifyRegOtp: (email, otp) => apiFetch("/auth/register/verify-otp", { method: "POST", body: { email, otp } }),
    register: (data) => apiFetch("/auth/register", { method: "POST", body: data }),
    logout: () => apiFetch("/auth/logout", { method: "POST", auth: true, body: {} })
};

export const ProfileAPI = {
    get: () => apiFetch("/profile", { auth: true }),
    update: (data) => apiFetch("/profile", { method: "PUT", auth: true, body: data }),
    photo: (file) => {
        const formData = new FormData();
        formData.append("photo", file);
        return apiFetch("/profile/photo", { method: "POST", auth: true, body: formData, isForm: true });
    }
};

export const AccountAPI = {
    sendDeleteOtp: () => apiFetch("/account/delete/send-otp", { method: "POST", auth: true, body: {} }),
    verifyDeleteOtp: (email, otp) => apiFetch("/account/delete/verify-otp", { method: "POST", auth: true, body: { email, otp } }),
    delete: () => apiFetch("/account?confirm=true", { method: "DELETE", auth: true })
};

export const LocationAPI = {
    countries: () => apiFetch("/locations/countries"),
    states: (countryId) => apiFetch(`/locations/countries/${countryId}/states`),
    cities: (stateId) => apiFetch(`/locations/states/${stateId}/cities`)
};