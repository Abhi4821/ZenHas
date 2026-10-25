
"use strict";

(function () {
    const subscriptions = new Map();

    function requireRoomId(roomId) {
        if (roomId === undefined || roomId === null || roomId === "") {
            throw new Error("A room ID is required for call signaling.");
        }
    }

    function requireUserId(userId) {
        if (userId === undefined || userId === null || userId === "") {
            throw new Error("A target user ID is required for call signaling.");
        }
    }

    function normalizeSdp(sdp) {
        if (typeof sdp === "string") {
            return sdp;
        }

        if (sdp && typeof sdp.sdp === "string") {
            return sdp.sdp;
        }

        throw new Error("A valid SDP string is required for call signaling.");
    }

    function publish(destination, payload) {
        if (!window.AudioSocket?.isConnected()) {
            throw new Error("Audio signaling is not connected.");
        }

        window.AudioSocket.publish(destination, payload);
    }

    function sendOffer({ roomId, senderId, targetUserId, sdp }) {
        requireRoomId(roomId);
        requireUserId(targetUserId);

        publish("/app/offer", {
            roomId,
            senderId,
            targetUserId,
            sdp: normalizeSdp(sdp)
        });
    }

    function sendAnswer({ roomId, senderId, targetUserId, sdp }) {
        requireRoomId(roomId);
        requireUserId(targetUserId);

        publish("/app/answer", {
            roomId,
            senderId,
            targetUserId,
            sdp: normalizeSdp(sdp)
        });
    }

    function sendIceCandidate({
        roomId,
        senderId,
        targetUserId,
        candidate
    }) {
        requireRoomId(roomId);
        requireUserId(targetUserId);

        if (!candidate) return;

        const candidateData =
            typeof candidate.toJSON === "function"
                ? candidate.toJSON()
                : candidate;

        publish("/app/ice", {
            roomId,
            senderId,
            targetUserId,
            candidate: candidateData.candidate,
            sdpMid: candidateData.sdpMid ?? null,
            sdpMLineIndex: candidateData.sdpMLineIndex ?? null
        });
    }

    function subscribeToRoom(roomId, handlers = {}) {
        requireRoomId(roomId);

        const key = String(roomId);

        unsubscribeFromRoom(roomId);

        const unsubscriptions = [];

        unsubscriptions.push(
            window.AudioSocket.subscribe(
                `/topic/call/${roomId}/offer`,
                message => handlers.onOffer?.(message)
            )
        );

        unsubscriptions.push(
            window.AudioSocket.subscribe(
                `/topic/call/${roomId}/answer`,
                message => handlers.onAnswer?.(message)
            )
        );

        unsubscriptions.push(
            window.AudioSocket.subscribe(
                `/topic/call/${roomId}/ice`,
                message => handlers.onIceCandidate?.(message)
            )
        );

        subscriptions.set(key, unsubscriptions);

        return () => unsubscribeFromRoom(roomId);
    }

    function unsubscribeFromRoom(roomId) {
        const key = String(roomId);
        const unsubscriptions = subscriptions.get(key);

        if (!unsubscriptions) {
            return;
        }

        unsubscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (error) {
                console.error(
                    "Unable to remove signaling subscription:",
                    error
                );
            }
        });

        subscriptions.delete(key);
    }

    function disconnect() {
        for (const key of [...subscriptions.keys()]) {
            unsubscribeFromRoom(key);
        }
    }

    window.AudioSignaling = Object.freeze({
        sendOffer,
        sendAnswer,
        sendIceCandidate,
        subscribeToRoom,
        unsubscribeFromRoom,
        disconnect
    });
})();
