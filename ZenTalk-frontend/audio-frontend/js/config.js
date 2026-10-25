"use strict";

window.AUDIO_CONFIG = Object.freeze({
    // API_BASE_URL: "http://localhost:8080",
    // WS_URL: "http://localhost:8080/ws/audio",

    API_BASE_URL: "http://192.168.1.83:8082",
    WS_URL: "http://192.168.1.83:8082/ws/audio",

  ENDPOINTS: {
        ENTER_QUEUE: "/api/v1/rooms/enter",
        EXIT_QUEUE: "/api/v1/rooms/exit",
        QUEUE_SNAPSHOT: "/api/v1/rooms/snapshot",
        CONNECT: "/api/v1/rooms/connect",
        ACCEPT: "/api/v1/rooms/accept",
        REJECT: "/api/v1/rooms/reject",
        CANCEL: "/api/v1/rooms/cancel",
        END_CALL: "/api/v1/call/end"
    },

    TOPICS: {
        AUDIO_EVENTS: "/topic/audio/events"
    },

    STORAGE_KEYS: {
        BLOCK_LIST: "audio_blocked_user_ids",
        CURRENT_CALL: "audio_current_call"
    },

    WEBRTC: {
        ICE_SERVERS: [
            { urls: "stun:stun.l.google.com:19302" }
        ]
    }
});