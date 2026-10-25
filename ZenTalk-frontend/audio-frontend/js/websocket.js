
"use strict";

(function () {
    const state = {
        socket: null,
        connected: false,
        connectingPromise: null,
        subscriptions: new Map(),
        subscriptionIds: new Map(),
        nextSubscriptionId: 1,
        buffer: "",
        heartbeatTimer: null
    };

    function getSocketUrl() {
        const config = window.AUDIO_CONFIG;

        if (!config?.WS_URL) {
            throw new Error("Audio WebSocket URL is not configured.");
        }

        const token = window.AudioAuth?.getToken?.();

        if (!token) {
            throw new Error("Authentication is required.");
        }

        const url = new URL(config.WS_URL);
        url.searchParams.set("token", token);

        return url.toString();
    }

    function sendFrame(command, headers = {}, body = "") {
        const socket = state.socket;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            throw new Error("Audio WebSocket is not connected.");
        }

        const headerText = Object.entries(headers)
            .map(([key, value]) => `${key}:${String(value)}`)
            .join("\n");

        const frame = `${command}\n${headerText}\n\n${body}\0`;
        socket.send(frame);
    }

    function parseFrames() {
        while (true) {
            const start = state.buffer.search(/[A-Z]/);

            if (start < 0) {
                state.buffer = "";
                return;
            }

            if (start > 0) {
                state.buffer = state.buffer.slice(start);
            }

            const separator = state.buffer.indexOf("\n\n");

            if (separator < 0) {
                return;
            }

            const headerBlock = state.buffer.slice(0, separator);
            const lines = headerBlock.split("\n");
            const command = lines.shift()?.trim();

            if (!command) {
                state.buffer = state.buffer.slice(separator + 2);
                continue;
            }

            const headers = {};

            for (const line of lines) {
                const index = line.indexOf(":");

                if (index > 0) {
                    headers[line.slice(0, index)] =
                        line.slice(index + 1);
                }
            }

            let bodyStart = separator + 2;
            let bodyEnd;

            if (headers["content-length"] !== undefined) {
                const length = Number(headers["content-length"]);
                bodyEnd = bodyStart + length;

                if (state.buffer.length <= bodyEnd) {
                    return;
                }
            } else {
                bodyEnd = state.buffer.indexOf("\0", bodyStart);

                if (bodyEnd < 0) {
                    return;
                }
            }

            const body = state.buffer.slice(bodyStart, bodyEnd);
            const terminator = state.buffer.indexOf("\0", bodyEnd);

            if (terminator < 0) {
                return;
            }

            state.buffer = state.buffer.slice(terminator + 1);
            handleFrame(command, headers, body);
        }
    }

    function handleFrame(command, headers, body) {
        if (command === "CONNECTED") {
            state.connected = true;
            startHeartbeat(headers);
            restoreSubscriptions();
            return;
        }

        if (command === "MESSAGE") {
            const subscriptionId = headers.subscription;
            const destination = headers.destination;

            const entry = [...state.subscriptions.entries()]
                .find(([key]) => key === subscriptionId);

            if (!entry && destination) {
                console.warn("Received an unsubscribed destination:", destination);
                return;
            }

            const callbacks = entry?.[1]?.callbacks;

            let parsedBody = body;

            try {
                parsedBody = JSON.parse(body);
            } catch {
                // Keep plain-text event bodies unchanged.
            }

            callbacks?.forEach(callback => {
                try {
                    callback(parsedBody);
                } catch (error) {
                    console.error("WebSocket message handler failed:", error);
                }
            });

            return;
        }

        


        if (command === "ERROR") {
            const message =
                body || headers.message || "Unknown STOMP error";

            console.error("STOMP error:", message);

            if (!state.connected && state.connectingPromise) {
                state.connectingPromise = null;
                state.connected = false;
            }

            return;
        }


        if (command === "RECEIPT") {
            // Receipt received from the STOMP broker.
        }
    }

    function startHeartbeat(headers) {
        clearInterval(state.heartbeatTimer);

        const heartbeat = headers["heart-beat"] || "0,0";
        const [serverOutgoing] = heartbeat.split(",").map(Number);

 
        if (serverOutgoing > 0) {
            state.heartbeatTimer = setInterval(() => {
                if (state.socket?.readyState === WebSocket.OPEN) {
                    state.socket.send("\n");
                }
            }, Math.max(serverOutgoing, 10000));
        }
    }


    function restoreSubscriptions() {
        state.subscriptions.forEach((entry, id) => {
            try {
                sendFrame("SUBSCRIBE", {
                    id,
                    destination: entry.destination,
                    ack: "auto"
                });

                entry.sent = true;
            } catch (error) {
                entry.sent = false;
                console.error(
                    "Unable to restore subscription:",
                    entry.destination,
                    error
                );
            }
        });
    }


    function connect() {
        if (state.connected && state.socket?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        if (state.connectingPromise) {
            return state.connectingPromise;
        }

        state.connectingPromise = new Promise((resolve, reject) => {
            let socket;

            try {
                socket = new WebSocket(getSocketUrl());
            } catch (error) {
                state.connectingPromise = null;
                reject(error);
                return;
            }

            state.socket = socket;
            state.buffer = "";

            let settled = false;

            socket.onopen = () => {
                sendFrame("CONNECT", {
                    "accept-version": "1.2,1.1",
                    "heart-beat": "10000,10000"
                });
            };

            socket.onmessage = event => {
                state.buffer += event.data;
                parseFrames();

                if (state.connected && !settled) {
                    settled = true;
                    resolve();
                }
            };

            socket.onerror = () => {
                if (!settled) {
                    settled = true;
                    reject(new Error("Unable to connect to the audio service."));
                }
            };

            socket.onclose = () => {
                state.connected = false;
                clearInterval(state.heartbeatTimer);
                state.heartbeatTimer = null;

                if (state.socket === socket) {
                    state.socket = null;
                    state.connectingPromise = null;
                }

                if (!settled) {
                    settled = true;
                    reject(new Error("Audio WebSocket closed before STOMP connection completed."));
                }
            };
        });

        return state.connectingPromise;
    }

    function subscribe(destination, callback) {
        if (!destination || typeof callback !== "function") {
            throw new Error("A destination and callback are required.");
        }

        let entry = [...state.subscriptions.entries()]
            .find(([, item]) => item.destination === destination);

        let id;

        if (entry) {
            id = entry[0];
            entry[1].callbacks.add(callback);
        } else {
            id = `sub-${state.nextSubscriptionId++}`;

            state.subscriptions.set(id, {
                destination,
                callbacks: new Set([callback])
            });
        }

        const sendSubscription = () => {
            const item = state.subscriptions.get(id);

            if (!item || !state.connected) {
                return;
            }

            if (!item.sent) {
                sendFrame("SUBSCRIBE", {
                    id,
                    destination,
                    ack: "auto"
                });

                item.sent = true;
            }
        };

        if (state.connected) {
            sendSubscription();
        } else {
            connect().then(sendSubscription).catch(error => {
                console.error("WebSocket subscription failed:", error);
            });
        }

        return () => {
            const item = state.subscriptions.get(id);

            if (!item) {
                return;
            }

            item.callbacks.delete(callback);

            if (item.callbacks.size === 0) {
                if (state.connected && item.sent) {
                    sendFrame("UNSUBSCRIBE", { id });
                }

                state.subscriptions.delete(id);
            }
        };
    }

    function publish(destination, body) {
        if (!state.connected) {
            throw new Error("Audio WebSocket is not connected.");
        }

        const payload = typeof body === "string"
            ? body
            : JSON.stringify(body);

        sendFrame("SEND", {
            destination,
            "content-type": "application/json"
        }, payload);
    }

    function disconnect() {
        clearInterval(state.heartbeatTimer);
        state.heartbeatTimer = null;

        if (state.socket?.readyState === WebSocket.OPEN) {
            try {
                sendFrame("DISCONNECT", {});
            } catch {
                // The connection may already be closing.
            }

            state.socket.close();
        }

        state.socket = null;
        state.connected = false;
        state.connectingPromise = null;
        state.buffer = "";

        state.subscriptions.clear();
    }

    function isConnected() {
        return state.connected &&
            state.socket?.readyState === WebSocket.OPEN;
    }

    window.AudioSocket = Object.freeze({
        connect,
        subscribe,
        publish,
        disconnect,
        isConnected
    });
})();
