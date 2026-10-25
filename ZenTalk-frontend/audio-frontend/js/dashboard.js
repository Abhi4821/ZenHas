
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("queueList");
    const status = document.getElementById("queueStatus");
    const enterButton = document.getElementById("enterQueueBtn");
    const exitButton = document.getElementById("exitQueueBtn");
    const refreshButton = document.getElementById("refreshQueueBtn");

    const token = localStorage.getItem("zentalk_token");

    if (!token) {
        window.location.replace("../auth-frontend/login.html");
        return;
    }

    if (!list) {
        console.error('Queue list element "#queueList" nahi mila.');
        return;
    }

    let queueUsers = [];
    let busy = false;
    let leavingPage = false;

    function getUtils() {
        if (!window.AudioUtils) {
            throw new Error(
                "AudioUtils load nahi hua. index.html mein utils.js ko dashboard.js se pehle load karein."
            );
        }

        const requiredMethods = [
            "filterBlockedUsers",
            "escapeHTML",
            "blockUser"
        ];

        for (const method of requiredMethods) {
            if (typeof window.AudioUtils[method] !== "function") {
                throw new Error(`AudioUtils.${method}() missing hai.`);
            }
        }

        return window.AudioUtils;
    }

    function setStatus(message) {
        if (status) status.textContent = message;
    }

    function renderQueue() {
        try {
            const utils = getUtils();
            const currentUserId = window.AudioAuth.getCurrentUserId();

            const usersWithoutSelf = currentUserId == null
                ? queueUsers
                : queueUsers.filter(user =>
                    user.userId != null &&
                    String(user.userId) !== String(currentUserId)
                );

            const visibleUsers =
                utils.filterBlockedUsers(usersWithoutSelf);

            list.replaceChildren();

            if (visibleUsers.length === 0) {
                const emptyState = document.createElement("div");
                emptyState.className = "empty-state";

                const heading = document.createElement("h3");
                heading.textContent = "No users to show";

                const paragraph = document.createElement("p");
                paragraph.textContent =
                    "Queue empty hai ya sabhi users Block List mein hain.";

                emptyState.append(heading, paragraph);
                list.appendChild(emptyState);
                return;
            }

            visibleUsers.forEach(user => {
                const card = document.createElement("article");
                card.className = "queue-card";

                const name = String(user.fullName || "Unknown user");
                const country = String(user.country || "");
                const state = String(user.state || "");
                const tier = String(user.rateTier || "—");
                const location = [state, country]
                    .filter(Boolean)
                    .join(", ");

                const avatar = document.createElement("div");
                avatar.className = "avatar";

                if (user.profilePhoto) {
                    const img = document.createElement("img");
                    img.src = user.profilePhoto;
                    img.alt = name;
                    img.loading = "lazy";

                    img.onerror = () => {
                        avatar.replaceChildren();

                        const initial = document.createElement("span");
                        initial.textContent = name.charAt(0).toUpperCase();
                        avatar.appendChild(initial);
                    };

                    avatar.appendChild(img);
                } else {
                    const initial = document.createElement("span");
                    initial.textContent = name.charAt(0).toUpperCase();
                    avatar.appendChild(initial);
                }

                const userInfo = document.createElement("div");
                userInfo.className = "user-info";

                const heading = document.createElement("h3");
                heading.textContent = name;

                const locationText = document.createElement("p");
                locationText.textContent =
                    location || "Location not available";

                const tierText = document.createElement("p");
                tierText.className = "tier";
                tierText.textContent = `Rate tier: ${tier}`;

                userInfo.append(heading, locationText, tierText);

                const actions = document.createElement("div");
                actions.className = "card-actions";

                const connectButton = document.createElement("button");
                connectButton.type = "button";
                connectButton.className = "btn btn-primary connect-btn";
                connectButton.textContent = "Connect";
                connectButton.dataset.userId = String(user.userId ?? "");

                const removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "btn btn-secondary remove-btn";
                removeButton.textContent = "Remove";
                removeButton.dataset.userId = String(user.userId ?? "");

                if (!user.userId) {
                    connectButton.disabled = true;
                    removeButton.disabled = true;
                }

                actions.append(connectButton, removeButton);
                card.append(avatar, userInfo, actions);
                list.appendChild(card);
            });
        } catch (error) {
            console.error("Queue render error:", error);
            list.replaceChildren();

            const errorMessage = document.createElement("p");
            errorMessage.className = "error-message";
            errorMessage.textContent = error.message;

            list.appendChild(errorMessage);
            setStatus(error.message);
        }
    }

    async function refreshQueue() {
        try {
            if (!window.AudioAPI ||
                typeof window.AudioAPI.getSnapshot !== "function") {
                throw new Error(
                    "AudioAPI load nahi hua. api.js ko dashboard.js se pehle load karein."
                );
            }

            const response = await window.AudioAPI.getSnapshot();
            const snapshot = response?.data ?? response;

            queueUsers = Array.isArray(snapshot?.users)
                ? snapshot.users
                : [];

            renderQueue();

            if (window.AudioUtils &&
                typeof window.AudioUtils.filterBlockedUsers === "function") {
                const visibleUsers =
                    window.AudioUtils.filterBlockedUsers(queueUsers);

                setStatus(`${visibleUsers.length} users available`);
            }
        } catch (error) {
            console.error("Queue refresh error:", error);
            setStatus(error.message);
        }
    }

    async function runQueueAction(action, successMessage) {
        if (busy) return;

        busy = true;

        if (enterButton) enterButton.disabled = true;
        if (exitButton) exitButton.disabled = true;
        if (refreshButton) refreshButton.disabled = true;

        try {
            await action();
            setStatus(successMessage);
            await refreshQueue();
        } catch (error) {
            console.error("Queue action error:", error);
            setStatus(error.message || "Action complete nahi ho saka.");
        } finally {
            busy = false;

            if (enterButton) enterButton.disabled = false;
            if (exitButton) exitButton.disabled = false;
            if (refreshButton) refreshButton.disabled = false;
        }
    }


    list.addEventListener("click", async event => {
        console.log("[DEBUG] Queue click detected:", event.target);

        const button = event.target.closest("button[data-user-id]");

        if (!button || !list.contains(button)) {
            console.log("[DEBUG] Expected button nahi mila.");
            return;
        }

        const userId = button.dataset.userId;

        console.log("[DEBUG] Button:", button.textContent);
        console.log("[DEBUG] User ID:", userId);

        if (!userId) {
            console.error("[DEBUG] User ID missing hai.");
            return;
        }

        if (button.classList.contains("remove-btn")) {
            console.log("[DEBUG] Remove clicked");

            try {
                getUtils().blockUser(userId);
                renderQueue();

                const count = getUtils()
                    .filterBlockedUsers(queueUsers).length;

                setStatus(`User blocked. ${count} users available.`);
            } catch (error) {
                console.error("[DEBUG] Remove error:", error);
                setStatus(error.message);
            }

            return;
        }






        if (button.classList.contains("connect-btn")) {
            if (busy) return;

            busy = true;
            button.disabled = true;

            try {


                // Step 1: Connect se pehle microphone permission maango
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error(
                        "Microphone access available nahi hai. Localhost ya HTTPS use karo."
                    );
                }

                setStatus("Microphone permission ka wait ho raha hai...");

                let permissionStream;

                try {
                    permissionStream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false
                    });
                } catch (error) {
                    if (error.name === "NotAllowedError" ||
                        error.name === "PermissionDeniedError") {
                        throw new Error(
                            "Call karne ke liye microphone permission Allow karo."
                        );
                    }

                    throw error;
                } finally {
                    // Permission check ke baad microphone tracks band karo.
                    // Actual audio call mein microphone dobara acquire hoga.
                    permissionStream?.getTracks().forEach(track => track.stop());
                }

                // Iske neeche tumhara existing selectedUser,
                // sessionStorage aur AudioAPI.connect() wala code rahega.

                // Selected dashboard card se user ki details lo
                const selectedUser = queueUsers.find(
                    user => String(user.userId) === String(userId)
                );

                if (!selectedUser) {
                    throw new Error("Selected user ki card details nahi mili.");
                }

                // Call screen par dikhane ke liye details save karo
                const contact = {
                    userId: selectedUser.userId,
                    fullName: selectedUser.fullName || "ZenTalk User",
                    profilePhoto: selectedUser.profilePhoto || "",
                    country: selectedUser.country || "",
                    state: selectedUser.state || "",
                    rateTier: selectedUser.rateTier || ""
                };

                sessionStorage.setItem(
                    "zentalk_pending_contact",
                    JSON.stringify(contact)
                );

                // Existing Connect API call
                const response = await window.AudioAPI.connect(userId);
                console.log("[CONNECT] API response:", response);

                const result = response?.data ?? response;
                const requestId =
                    result?.requestId ??
                    result?.connectRequestId ??
                    result?.id;

                if (requestId == null) {
                    throw new Error(
                        "Connect API response mein request ID nahi mili."
                    );
                }

                // Existing call page navigation
                const params = new URLSearchParams({
                    role: "caller-pending",
                    targetUserId: String(userId),
                    requestId: String(requestId)
                });

                window.location.href = `pages/call.html?${params.toString()}`;

            } catch (error) {
                console.error("[CONNECT] Error:", error);
                setStatus(error.message || "Call request failed.");
                button.disabled = false;
            } finally {
                busy = false;
            }

            return;
        }

    });


    enterButton?.addEventListener("click", () => {
        runQueueAction(
            () => window.AudioAPI.enterQueue(),
            "Aap queue mein enter ho gaye."
        );
    });

    exitButton?.addEventListener("click", () => {
        runQueueAction(
            () => window.AudioAPI.exitQueue(),
            "Aap queue se exit ho gaye."
        );
    });

    refreshButton?.addEventListener("click", refreshQueue);

    window.refreshAudioQueue = refreshQueue;

    // Browser Back arrow confirmation
    history.pushState({ queueGuard: true }, "", location.href);

    window.addEventListener("popstate", async () => {
        if (leavingPage) return;

        const shouldLeave = window.confirm(
            "Kya aap Audio Dashboard se bahar jana chahte hain?\n\n" +
            "OK = Queue se exit karke bahar jayein\n" +
            "Cancel = Isi page par rahein"
        );

        if (!shouldLeave) {
            // Dashboard par hi raho; back guard restore karo.
            history.pushState({ queueGuard: true }, "", location.href);
            return;
        }

        leavingPage = true;

        try {
            await window.AudioAPI.exitQueue();

            // Guard ko bypass karke previous page par jao.
            history.back();
        } catch (error) {
            leavingPage = false;

            alert(
                "Queue se exit nahi ho paya: " +
                (error.message || "Unknown error")
            );

            // Error aane par dashboard par hi raho.
            history.pushState({ queueGuard: true }, "", location.href);
        }
    });


    // refreshQueue();


    refreshQueue();

    // Incoming call requests receive karne ke liye WebSocket subscribe karo
    if (
        window.AudioSocket &&
        typeof window.AudioSocket.connect === "function" &&
        typeof window.AudioSocket.subscribe === "function"
    ) {
        window.AudioSocket.connect()
            .then(() => {
                console.log("[DASHBOARD] AudioSocket connected");

                window.AudioSocket.subscribe(
                    window.AUDIO_CONFIG.TOPICS.AUDIO_EVENTS,
                    async (payload) => {
                        console.log(
                            "[DASHBOARD] Incoming WebSocket payload:",
                            payload
                        );

                        let event = payload;

                        if (typeof event === "string") {
                            try {
                                event = JSON.parse(event);
                            } catch (error) {
                                console.error(
                                    "[DASHBOARD] Invalid event JSON:",
                                    error
                                );
                                return;
                            }
                        }

                        // Incoming request event ke required fields
                        const requestId =
                            event?.requestId ??
                            event?.connectRequestId;

                        const senderId =
                            event?.senderId ??
                            event?.requesterId;

                        const receiverId =
                            event?.receiverId ??
                            event?.targetUserId;

                        if (
                            requestId == null ||
                            senderId == null ||
                            receiverId == null
                        ) {
                            console.warn(
                                "[DASHBOARD] Required request fields missing:",
                                event
                            );
                            return;
                        }

                        const currentUserId =
                            window.AudioAuth.getCurrentUserId();

                        // Sirf request ka receiver incoming page khole
                        if (
                            currentUserId == null ||
                            String(receiverId) !== String(currentUserId)
                        ) {
                            return;
                        }

                        const handledKey = "zentalk_handled_request";

                        if (
                            sessionStorage.getItem(handledKey) ===
                            String(requestId)
                        ) {
                            return;
                        }

                        sessionStorage.setItem(
                            handledKey,
                            String(requestId)
                        );

                        // Queue se sender ki profile details lene ki koshish karo
                        await refreshQueue();

                        const sender = queueUsers.find(
                            user =>
                                String(user.userId) === String(senderId)
                        );

                        if (sender) {
                            sessionStorage.setItem(
                                "zentalk_pending_contact",
                                JSON.stringify({
                                    userId: sender.userId,
                                    fullName:
                                        sender.fullName || "ZenTalk User",
                                    profilePhoto: sender.profilePhoto || "",
                                    country: sender.country || "",
                                    state: sender.state || "",
                                    rateTier: sender.rateTier || ""
                                })
                            );
                        } else {
                            // Sender queue snapshot mein na ho, tab bhi request details save karo
                            sessionStorage.setItem(
                                "zentalk_pending_contact",
                                JSON.stringify({
                                    userId: senderId,
                                    fullName: event.senderName || "ZenTalk User",
                                    profilePhoto: event.profilePhoto || "",
                                    country: event.country || "",
                                    state: event.state || "",
                                    rateTier: event.rateTier || ""
                                })
                            );
                        }

                        const params = new URLSearchParams({
                            role: "receiver-pending",
                            requestId: String(requestId),
                            targetUserId: String(senderId)
                        });

                        window.location.href =
                            `pages/call.html?${params.toString()}`;
                    }
                );

                console.log(
                    "[DASHBOARD] Subscribed to:",
                    window.AUDIO_CONFIG.TOPICS.AUDIO_EVENTS
                );
            })
            .catch(error => {
                console.error(
                    "[DASHBOARD] WebSocket connection failed:",
                    error
                );
                setStatus(
                    error.message || "WebSocket connection failed."
                );
            });
    } else {
        console.error(
            "[DASHBOARD] AudioSocket.connect() ya subscribe() missing hai."
        );
        setStatus("WebSocket subscription available nahi hai.");
    }



});
