
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const status = $("callStatus");
    const micButton = $("micBtn");
    const endButton = $("endCallBtn");
    const remoteAudio = $("remoteAudio");
    const localAudio = $("localAudio");

    const incomingActions = $("incomingActions");
    const outgoingActions = $("outgoingActions");
    const activeActions = $("activeActions");
    const acceptButton = $("acceptCallBtn");
    const rejectButton = $("rejectCallBtn");
    const cancelButton = $("cancelCallBtn");
    const timerElement = $("callTimer");
    const notice = $("callNotice");

    if (!status || !micButton || !endButton) {
        console.error("Call page ke required HTML elements nahi mile.");
        return;
    }

    if (
        !window.AudioAPI ||
        !window.AudioSocket ||
        !window.AudioSignaling ||
        !window.AUDIO_CONFIG
    ) {
        status.textContent = "Audio modules load nahi hue. Script order check karo.";
        return;
    }

    const params = new URLSearchParams(location.search);

    let role = params.get("role") || "";
    let roomId = params.get("roomId") || "";
    let targetUserId = params.get("targetUserId") || "";
    const requestId = params.get("requestId") || "";

    const currentUserId = window.AudioAuth?.getCurrentUserId?.();

    let stream = null;
    let peer = null;
    let isMuted = false;
    let closed = false;
    let active = false;
    let started = false;
    let socketStarted = false;
    let remoteDescriptionSet = false;
    let pendingIceCandidates = [];
    let subscriptionsCleanup = null;
    let globalEventUnsubscribe = null;
    let endCallPromise = null;
    let timerInterval = null;
    let callStartedAt = 0;

    let contact = null;

    try {
        contact = JSON.parse(
            sessionStorage.getItem("zentalk_pending_contact") || "null"
        );
    } catch {
        contact = null;
    }

    function setStatus(message) {
        status.textContent = message;
    }

    function showNotice(message) {
        if (!notice) return;
        notice.textContent = message;
        notice.hidden = false;
    }

    function hideNotice() {
        if (!notice) return;
        notice.textContent = "";
        notice.hidden = true;
    }

    function showActions(state) {
        if (incomingActions) incomingActions.hidden = state !== "incoming";
        if (outgoingActions) outgoingActions.hidden = state !== "pending";
        if (activeActions) activeActions.hidden = state !== "active";
        if (timerElement) timerElement.hidden = state !== "active";

        micButton.disabled = state !== "active";
        endButton.disabled = state !== "active";

        if (acceptButton) acceptButton.disabled = state !== "incoming";
        if (rejectButton) rejectButton.disabled = state !== "incoming";
        if (cancelButton) cancelButton.disabled = state !== "pending";
    }

    function getErrorMessage(error) {
        if (error?.name === "NotAllowedError") {
            return "Microphone permission allow karo.";
        }

        if (error?.name === "NotFoundError") {
            return "Microphone device nahi mila.";
        }

        if (error?.name === "NotReadableError") {
            return "Microphone kisi doosri application mein use ho raha hai.";
        }

        return error?.message || "Call start nahi ho saki.";
    }

    function parseEvent(payload) {
        let value = payload;

        for (let i = 0; i < 2 && typeof value === "string"; i++) {
            const text = value.trim();
            if (!text) break;

            try {
                value = JSON.parse(text);
            } catch {
                break;
            }
        }

        return value;
    }

    function displayContact(data) {
        if (!data) return;

        const nameElement = $("contactName");
        const emailElement = $("contactEmail");
        const genderElement = $("contactGender");
        const addressElement = $("contactAddress");
        const avatar = $("contactAvatar");
        const fallback = $("contactAvatarFallback");

        const name = data.fullName || "ZenTalk User";

        if (nameElement) nameElement.textContent = name;
        if (emailElement) emailElement.textContent = data.email || "";
        if (genderElement) genderElement.textContent = data.gender || "";

        if (addressElement) {
            addressElement.textContent = [
                data.state,
                data.country
            ].filter(Boolean).join(", ") || "Location unavailable";
        }

        if (avatar) {
            avatar.onerror = () => {
                avatar.hidden = true;

                if (fallback) {
                    fallback.hidden = false;
                    fallback.textContent = name.charAt(0).toUpperCase();
                }
            };

            if (data.profilePhoto) {
                avatar.src = data.profilePhoto;
                avatar.alt = name;
                avatar.hidden = false;

                if (fallback) fallback.hidden = true;
            } else {
                avatar.removeAttribute("src");
                avatar.hidden = true;

                if (fallback) {
                    fallback.hidden = false;
                    fallback.textContent = name.charAt(0).toUpperCase();
                }
            }
        }
    }

    displayContact(contact);

    function startTimer() {
        if (!timerElement || timerInterval) return;

        callStartedAt = Date.now();

        const update = () => {
            const seconds = Math.floor(
                (Date.now() - callStartedAt) / 1000
            );

            const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
            const remaining = String(seconds % 60).padStart(2, "0");

            timerElement.textContent = `${minutes}:${remaining}`;
        };

        update();
        timerInterval = setInterval(update, 1000);
    }

    function stopTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = null;
    }

    async function flushPendingIceCandidates() {
        if (!peer || !remoteDescriptionSet) return;

        const candidates = pendingIceCandidates;
        pendingIceCandidates = [];

        for (const candidate of candidates) {
            try {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Queued ICE candidate error:", error);
            }
        }
    }

    async function handleOffer(message) {
        try {
            if (closed || !peer || role !== "receiver") {
                return;
            }

            const offerSdp = typeof message?.sdp === "string"
                ? message.sdp
                : message?.sdp?.sdp;

            if (!offerSdp) {
                console.error("Invalid offer message:", message);
                throw new Error("Offer SDP missing hai.");
            }

            console.log("[WebRTC] Offer received:", {
                senderId: message.senderId,
                roomId: message.roomId,
                sdpType: typeof message.sdp
            });

            await peer.setRemoteDescription({
                type: "offer",
                sdp: offerSdp
            });

            remoteDescriptionSet = true;

            await flushPendingIceCandidates();

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            const answerSdp = peer.localDescription?.sdp;

            if (!answerSdp) {
                throw new Error("Answer SDP create nahi hua.");
            }

            window.AudioSignaling.sendAnswer({
                roomId,
                senderId: currentUserId,
                targetUserId: message.senderId || targetUserId,
                sdp: answerSdp
            });

            console.log("[WebRTC] Answer sent:", {
                roomId,
                targetUserId: message.senderId || targetUserId
            });

            setStatus("Answer sent. Audio connect ho raha hai...");
        } catch (error) {
            console.error("Offer handling error:", error);
            setStatus(`Offer error: ${getErrorMessage(error)}`);
        }
    }

    // UPDATED: SDP string aur { type, sdp } object dono support hain.
    async function handleAnswer(message) {
        try {
            const answerSdp =
                typeof message?.sdp === "string"
                    ? message.sdp
                    : message?.sdp?.sdp;

            if (closed || !peer || !answerSdp || role !== "caller") {
                return;
            }

            await peer.setRemoteDescription({
                type: "answer",
                sdp: answerSdp
            });

            remoteDescriptionSet = true;
            await flushPendingIceCandidates();

            setStatus("Answer received. Audio connect ho raha hai...");
        } catch (error) {
            console.error("Answer handling error:", error);
            setStatus(`Answer error: ${getErrorMessage(error)}`);
        }
    }

    // UPDATED: Flat candidate aur nested candidate object dono support hain.
    async function handleIce(message) {
        try {
            if (closed || !message?.candidate) return;

            const candidate = typeof message.candidate === "string"
                ? {
                    candidate: message.candidate,
                    sdpMid: message.sdpMid ?? null,
                    sdpMLineIndex: message.sdpMLineIndex ?? null
                }
                : {
                    candidate: message.candidate.candidate,
                    sdpMid:
                        message.candidate.sdpMid ??
                        message.sdpMid ??
                        null,
                    sdpMLineIndex:
                        message.candidate.sdpMLineIndex ??
                        message.sdpMLineIndex ??
                        null
                };

            if (!candidate.candidate) return;

            if (!peer || !remoteDescriptionSet) {
                pendingIceCandidates.push(candidate);
                return;
            }

            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error("ICE candidate error:", error);
        }
    }

    function createPeerConnection() {
        // UPDATED: config.js ka ICE_SERVERS array sahi wrapper ke saath use karo.
        const configuredIceServers =
            window.AUDIO_CONFIG.WEBRTC?.ICE_SERVERS ||
            [{ urls: "stun:stun.l.google.com:19302" }];

        peer = new RTCPeerConnection({
            iceServers: configuredIceServers
        });

        stream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
            peer.addTrack(track, stream);
        });

        // peer.ontrack = async event => {
        //     if (closed || !remoteAudio) return;

        //     if (event.streams?.[0]) {
        //         remoteAudio.srcObject = event.streams[0];
        //     } else {
        //         let remoteStream = remoteAudio.srcObject;

        //         if (!(remoteStream instanceof MediaStream)) {
        //             remoteStream = new MediaStream();
        //             remoteAudio.srcObject = remoteStream;
        //         }

        //         if (!remoteStream.getTracks().includes(event.track)) {
        //             remoteStream.addTrack(event.track);
        //         }
        //     }

        //     try {
        //         await remoteAudio.play();
        //         setStatus("Audio call connected.");
        //     } catch (error) {
        //         console.warn("Remote audio autoplay blocked:", error);
        //         setStatus("Remote audio sunne ke liye page par click karo.");
        //     }
        // };

        peer.ontrack = async event => {
            if (closed || !remoteAudio) return;

            if (event.streams?.[0]) {
                remoteAudio.srcObject = event.streams[0];
            } else {
                let remoteStream = remoteAudio.srcObject;

                if (!(remoteStream instanceof MediaStream)) {
                    remoteStream = new MediaStream();
                    remoteAudio.srcObject = remoteStream;
                }

                if (!remoteStream.getTracks().includes(event.track)) {
                    remoteStream.addTrack(event.track);
                }
            }

            setupCallAudioControls(remoteAudio);

            try {
                await remoteAudio.play();
                setStatus("Audio call connected.");
            } catch (error) {
                console.warn("Remote audio autoplay blocked:", error);
                setStatus("Remote audio sunne ke liye page par click karo.");
            }
        };


        peer.onicecandidate = event => {
            if (!event.candidate || closed) return;

            try {
                window.AudioSignaling.sendIceCandidate({
                    roomId,
                    senderId: currentUserId,
                    targetUserId,
                    candidate: event.candidate
                });
            } catch (error) {
                console.error("ICE send error:", error);
                setStatus("ICE signaling send nahi ho saka.");
            }
        };

        peer.onconnectionstatechange = () => {
            if (!peer || closed) return;

            switch (peer.connectionState) {
                case "connected":
                    setStatus("Audio call connected.");
                    break;
                case "connecting":
                    setStatus("Audio connect ho raha hai...");
                    break;
                case "disconnected":
                    setStatus("Network connection temporarily disconnected.");
                    break;
                case "failed":
                    setStatus("Connection failed. TURN configuration ki zaroorat ho sakti hai.");
                    break;
                case "closed":
                    break;
                default:
                    setStatus(`Connection: ${peer.connectionState}`);
            }
        };

        peer.oniceconnectionstatechange = () => {
            if (peer?.iceConnectionState === "failed") {
                console.error("ICE connection failed. TURN configuration check karo.");
            }
        };
    }

    async function ensureGlobalSubscription() {
        if (!window.AUDIO_CONFIG?.TOPICS?.AUDIO_EVENTS) {
            throw new Error("AUDIO_EVENTS topic configure nahi hai.");
        }

        if (!window.AudioSocket.isConnected()) {
            await window.AudioSocket.connect();
        }

        socketStarted = true;

        if (!globalEventUnsubscribe) {
            globalEventUnsubscribe = window.AudioSocket.subscribe(
                window.AUDIO_CONFIG.TOPICS.AUDIO_EVENTS,
                handleGlobalEvent
            );
        }
    }

    async function startActiveCall() {
        if (started || closed) return;

        if (!roomId) {
            setStatus("Call roomId abhi nahi mila hai.");
            return;
        }

        if (role !== "caller" && role !== "receiver") {
            setStatus("Invalid active call role.");
            return;
        }

        if (!targetUserId) {
            setStatus("targetUserId missing hai.");
            return;
        }

        if (currentUserId == null) {
            setStatus("Logged-in user ID nahi mil raha. Auth module check karo.");
            return;
        }

        started = true;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Microphone access available nahi hai. Localhost ya HTTPS use karo."
                );
            }

            showActions("active");
            setStatus("Microphone permission maangi ja rahi hai...");

            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });

            if (closed) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                return;
            }

            isMuted = false;
            stream.getAudioTracks().forEach(track => {
                track.enabled = true;
            });

            micButton.textContent = "Mute microphone";
            micButton.setAttribute("aria-pressed", "false");

            if (localAudio) {
                localAudio.srcObject = stream;
                localAudio.muted = true;
            }

            await ensureGlobalSubscription();

            if (closed) return;

            createPeerConnection();

            subscriptionsCleanup = window.AudioSignaling.subscribeToRoom(
                roomId,
                {
                    onOffer: handleOffer,
                    onAnswer: handleAnswer,
                    onIceCandidate: handleIce
                }
            );

            active = true;
            startTimer();

            if (role === "caller") {
                setStatus("Calling... Offer create ho raha hai.");

                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);

                window.AudioSignaling.sendOffer({
                    roomId,
                    senderId: currentUserId,
                    targetUserId,
                    sdp: peer.localDescription
                });

                setStatus("Call offer sent. Receiver ke response ka wait hai...");
            } else {
                setStatus("Call ready. Caller ke offer ka wait hai...");
            }
        } catch (error) {
            console.error("Call startup error:", error);
            setStatus(getErrorMessage(error));

            cleanupLocalResources();
            started = false;
            active = false;
            showActions("none");
        }
    }

    function handleGlobalEvent(rawPayload) {
        const event = parseEvent(rawPayload);

        console.debug("[CALL] Global audio event:", event);

        if (closed || !event) return;

        if (
            role === "caller-pending" &&
            typeof event === "object" &&
            event.roomId &&
            event.callerId != null &&
            event.receiverId != null
        ) {
            const callerMatches =
                currentUserId != null &&
                String(event.callerId) === String(currentUserId);

            const receiverMatches =
                String(event.receiverId) === String(targetUserId);

            if (!callerMatches || !receiverMatches) return;

            roomId = String(event.roomId);
            role = "caller";

            const newUrl = new URL(location.href);
            newUrl.searchParams.set("role", "caller");
            newUrl.searchParams.set("roomId", roomId);
            history.replaceState({}, "", newUrl);

            setStatus("Call accepted. Microphone start ho raha hai...");
            startActiveCall();
            return;
        }

        if (typeof event === "string") {
            if (requestId && event === `REQUEST_CANCELLED:${requestId}`) {
                showNotice("Call request cancel kar di gayi.");
                setStatus("Call request cancelled.");
                returnToDashboard(1000);
                return;
            }

            if (requestId && event === `REQUEST_REJECTED:${requestId}`) {
                showNotice("Receiver ne call request decline kar di.");
                setStatus("Call not answered.");
                returnToDashboard(1800);
            }

            return;
        }

        if (
            typeof event === "object" &&
            event.requestId != null &&
            String(event.requestId) === String(requestId) &&
            event.senderId != null &&
            event.receiverId != null &&
            event.createdAt == null
        ) {
            showNotice("Call request expire ho gayi. Dobara Connect karein.");
            setStatus("Call request timed out.");
            returnToDashboard(1800);
        }
    }

    function returnToDashboard(delay) {
        setTimeout(() => {
            if (!closed) {
                closed = true;
                cleanupLocalResources();
                location.href = "../index.html";
            }
        }, delay);
    }

    async function connectSocketForPendingCall() {
        await ensureGlobalSubscription();
    }

    async function cancelPendingCall() {
        if (closed) return;

        if (!requestId) {
            showNotice("Request ID missing hai; cancel API call nahi ho sakti.");
            return;
        }

        if (!window.AudioAPI.cancel) {
            showNotice("Cancel API available nahi hai.");
            return;
        }

        if (cancelButton) cancelButton.disabled = true;
        setStatus("Call request cancel ho rahi hai...");

        try {
            await window.AudioAPI.cancel(requestId);

            closed = true;
            cleanupLocalResources();
            setStatus("Call request cancelled.");
            location.href = "../index.html";
        } catch (error) {
            console.error("Cancel request error:", error);
            setStatus(getErrorMessage(error));

            if (cancelButton) cancelButton.disabled = false;
        }
    }

    async function acceptIncomingCall() {
        if (!requestId || !window.AudioAPI.accept) {
            setStatus("Request ID ya Accept API missing hai.");
            return;
        }

        if (acceptButton) acceptButton.disabled = true;
        if (rejectButton) rejectButton.disabled = true;

        try {
            setStatus("Call accept ho rahi hai...");

            const response = await window.AudioAPI.accept(requestId);
            const result = response?.data ?? response;

            if (!result?.roomId) {
                throw new Error("Accept response mein roomId nahi mila.");
            }

            roomId = String(result.roomId);
            role = "receiver";

            const newUrl = new URL(location.href);
            newUrl.searchParams.set("role", "receiver");
            newUrl.searchParams.set("roomId", roomId);
            newUrl.searchParams.set("targetUserId", targetUserId);
            history.replaceState({}, "", newUrl);

            setStatus("Call accepted. Microphone permission allow karo.");
            await startActiveCall();
        } catch (error) {
            console.error("Accept call error:", error);
            setStatus(getErrorMessage(error));

            if (acceptButton) acceptButton.disabled = false;
            if (rejectButton) rejectButton.disabled = false;
        }
    }

    async function rejectIncomingCall() {
        if (!requestId || !window.AudioAPI.reject) {
            setStatus("Request ID ya Reject API missing hai.");
            return;
        }

        if (acceptButton) acceptButton.disabled = true;
        if (rejectButton) rejectButton.disabled = true;

        try {
            setStatus("Call request decline ho rahi hai...");
            await window.AudioAPI.reject(requestId);

            closed = true;
            cleanupLocalResources();
            location.href = "../index.html";
        } catch (error) {
            console.error("Reject call error:", error);
            setStatus(getErrorMessage(error));

            if (acceptButton) acceptButton.disabled = false;
            if (rejectButton) rejectButton.disabled = false;
        }
    }

    function cleanupLocalResources() {
        stopTimer();

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        if (peer) {
            peer.ontrack = null;
            peer.onicecandidate = null;
            peer.onconnectionstatechange = null;
            peer.oniceconnectionstatechange = null;
            peer.close();
            peer = null;
        }

        if (remoteAudio) {
            remoteAudio.pause();
            remoteAudio.srcObject = null;
        }

        if (localAudio) {
            localAudio.pause();
            localAudio.srcObject = null;
        }

        pendingIceCandidates = [];
        remoteDescriptionSet = false;

        if (subscriptionsCleanup) {
            subscriptionsCleanup();
            subscriptionsCleanup = null;
        }

        if (roomId) {
            window.AudioSignaling.unsubscribeFromRoom?.(roomId);
        }

        if (globalEventUnsubscribe) {
            globalEventUnsubscribe();
            globalEventUnsubscribe = null;
        }

        if (socketStarted) {
            window.AudioSignaling.disconnect?.();
            window.AudioSocket.disconnect();
            socketStarted = false;
        }
    }

    function endCall(reason = "USER_ENDED") {
        if (endCallPromise) return endCallPromise;

        if (!roomId || !active) {
            return cancelPendingCall();
        }

        closed = true;
        active = false;
        showActions("none");
        cleanupLocalResources();
        setStatus("Call ended. Server update ho raha hai...");

        endCallPromise = (async () => {
            try {
                // api.js signature: endCall(roomId, reason)
                await window.AudioAPI.endCall(roomId, reason);
                setStatus("Call successfully ended.");
            } catch (error) {
                console.error("Backend call-end request failed:", error);
                setStatus("Call locally ended, but server update failed.");
            } finally {
                location.href = "../index.html";
            }
        })();

        return endCallPromise;
    }

    micButton.addEventListener("click", () => {
        if (!stream || closed || !active) return;

        isMuted = !isMuted;

        stream.getAudioTracks().forEach(track => {
            track.enabled = !isMuted;
        });

        micButton.textContent = isMuted
            ? "Unmute microphone"
            : "Mute microphone";

        micButton.setAttribute("aria-pressed", String(isMuted));
        setStatus(isMuted ? "Microphone muted." : "Microphone unmuted.");
    });

    endButton.addEventListener("click", () => {
        endCall("USER_ENDED");
    });

    cancelButton?.addEventListener("click", cancelPendingCall);
    acceptButton?.addEventListener("click", acceptIncomingCall);
    rejectButton?.addEventListener("click", rejectIncomingCall);

    window.addEventListener("pagehide", () => {
        if (!closed) {
            closed = true;
            cleanupLocalResources();
        }
    });

    async function initialize() {
        hideNotice();

        if (role === "caller-pending") {
            showActions("pending");
            setStatus("Calling... Receiver ke response ka wait hai.");

            if (!requestId || !targetUserId) {
                setStatus("requestId ya targetUserId URL mein missing hai.");
                if (cancelButton) cancelButton.disabled = true;
                return;
            }

            try {
                await connectSocketForPendingCall();
            } catch (error) {
                console.error("Pending call WebSocket error:", error);
                setStatus(
                    "Call waiting hai, lekin WebSocket connect nahi hua: " +
                    getErrorMessage(error)
                );
            }

            return;
        }

        if (role === "receiver-pending") {
            showActions("incoming");
            setStatus("Incoming call. Accept ya Decline karein.");

            if (!requestId || !targetUserId) {
                setStatus("Incoming request ke liye requestId/targetUserId missing hai.");
                showActions("none");
                return;
            }

            try {
                await connectSocketForPendingCall();
            } catch (error) {
                console.error("Incoming call WebSocket error:", error);
                setStatus("WebSocket connect nahi hua: " + getErrorMessage(error));
            }

            return;
        }

        if (role === "caller" || role === "receiver") {
            showActions("none");

            if (!roomId) {
                setStatus("Active call ke liye roomId missing hai.");
                return;
            }

            await startActiveCall();
            return;
        }

        showActions("none");
        setStatus("Invalid call role. URL mein role check karo.");
    }

    initialize();


    function setupCallAudioControls(remoteAudio) {
        if (!remoteAudio || document.getElementById("callAudioControls")) {
            return;
        }

        remoteAudio.volume = 1;
        remoteAudio.muted = false;

        const controls = document.createElement("div");
        controls.id = "callAudioControls";
        controls.className = "call-audio-controls";

        controls.innerHTML = `
        <button type="button"
                class="call-audio-mode-btn"
                id="audioModeToggle"
                aria-pressed="false">
            <span class="audio-icon" id="audioModeIcon">🔈</span>
            <span id="audioModeLabel">Normal</span>
            <span class="audio-toggle-track">
                <span class="audio-toggle-knob"></span>
            </span>
        </button>
    `;

        const callScreen =
            document.querySelector("#callScreen") ||
            document.querySelector(".call-screen") ||
            remoteAudio.parentElement;

        callScreen.appendChild(controls);

        const toggle = controls.querySelector("#audioModeToggle");
        const icon = controls.querySelector("#audioModeIcon");
        const label = controls.querySelector("#audioModeLabel");

        let speakerMode = false;

        toggle.addEventListener("click", async () => {
            const nextMode = !speakerMode;

            remoteAudio.volume = 1;
            remoteAudio.muted = false;

            if (typeof remoteAudio.setSinkId === "function") {
                try {
                    if (nextMode) {
                        const devices =
                            await navigator.mediaDevices.enumerateDevices();

                        const speaker = devices.find(device =>
                            device.kind === "audiooutput" &&
                            /speaker|loudspeaker/i.test(device.label)
                        );

                        if (speaker) {
                            await remoteAudio.setSinkId(speaker.deviceId);
                        } else {
                            console.info(
                                "No separate speaker output found; using default output."
                            );
                        }
                    } else {
                        await remoteAudio.setSinkId("");
                    }
                } catch (error) {
                    console.warn("Audio output switching unavailable:", error);
                    return;
                }
            }

            speakerMode = nextMode;

            icon.textContent = speakerMode ? "🔊" : "🔈";
            label.textContent = speakerMode ? "Speaker" : "Normal";
            toggle.setAttribute("aria-pressed", String(speakerMode));
            toggle.classList.toggle("active", speakerMode);
        });
    }


});
