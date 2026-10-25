
const $ = (selector) => document.querySelector(selector);

const messages = $("#messages");
const input = $("#messageInput");
const form = $("#chatForm");
const sendButton = $("#sendButton");
const charCount = $("#charCount");
const sidebar = $("#sidebar");
const toast = $("#toast");

const API_URL = "http://localhost:8080/api/chat";

let isSending = false;
let toastTimer;

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function scrollToBottom() {
    if (messages) {
        messages.scrollTop = messages.scrollHeight;
    }
}

function currentTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function addMessage(role, text = "", typing = false) {
    const welcome = $("#welcomeBlock");
    if (welcome) welcome.remove();

    const row = document.createElement("div");
    row.className = `message-row ${role}`;

    if (role === "assistant") {
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "✳";
        row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const textNode = document.createTextNode(text);
    bubble.appendChild(textNode);

    if (typing) {
        const dots = document.createElement("span");
        dots.className = "typing-dots";

        for (let i = 0; i < 3; i++) {
            dots.appendChild(document.createElement("i"));
        }

        bubble.appendChild(dots);
    } else if (role === "assistant") {
        addMessageMeta(bubble, textNode);
    }

    row.appendChild(bubble);
    messages.appendChild(row);
    scrollToBottom();

    return { row, bubble, textNode };
}

function addMessageMeta(bubble, textNode) {
    const meta = document.createElement("div");
    meta.className = "message-meta";

    const time = document.createElement("span");
    time.textContent = currentTime();

    const tools = document.createElement("div");
    tools.className = "message-tools";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy";

    copy.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(textNode.textContent);
            showToast("Copied");
        } catch {
            try {
                const temporary = document.createElement("textarea");
                temporary.value = textNode.textContent;
                temporary.style.position = "fixed";
                temporary.style.opacity = "0";

                document.body.appendChild(temporary);
                temporary.select();

                const copied = document.execCommand("copy");
                temporary.remove();

                showToast(copied ? "Copied" : "Could not copy text");
            } catch {
                showToast("Could not copy text");
            }
        }
    });

    tools.appendChild(copy);
    meta.append(time, tools);
    bubble.appendChild(meta);
}

function updateInput() {
    if (!input || !charCount) return;

    charCount.textContent = `${input.value.length} / 8000`;

    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

function setBusy(busy) {
    isSending = busy;

    sendButton.disabled = busy;
    input.disabled = busy;
    sendButton.textContent = busy ? "…" : "↑";
}

function getHistory() {
    try {
        return JSON.parse(
            localStorage.getItem("aiChatHistory") || "[]"
        );
    } catch {
        return [];
    }
}

function saveHistory(prompt) {
    const history = getHistory();

    history.unshift({
        title: prompt.slice(0, 45),
        prompt
    });

    localStorage.setItem(
        "aiChatHistory",
        JSON.stringify(history.slice(0, 10))
    );

    renderHistory();
}

function renderHistory() {
    const list = $("#historyList");
    if (!list) return;

    list.replaceChildren();

    const history = getHistory();

    if (!history.length) {
        const empty = document.createElement("p");
        empty.className = "empty-history";
        empty.textContent = "Your chats will appear here.";
        list.appendChild(empty);
        return;
    }

    history.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";
        button.textContent = item.title;

        button.addEventListener("click", () => {
            input.value = item.prompt;
            updateInput();
            input.focus();
            sidebar?.classList.remove("open");
        });

        list.appendChild(button);
    });
}

/*
 * Handles both:
 * 1. Normal text/plain responses
 * 2. Server-Sent Events (text/event-stream)
 *
 * SSE data is appended exactly as received.
 * Leading spaces are preserved.
 */
async function readResponse(response, target) {
    if (!response.body) {
        target.textNode.textContent = await response.text();
        return;
    }

    const contentType = (
        response.headers.get("content-type") || ""
    ).toLowerCase();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let output = "";
    let buffer = "";
    let isSSE = contentType.includes("text/event-stream");

    function render() {
        target.textNode.textContent = output;
        scrollToBottom();
    }

    function processEvent(event) {
        const lines = event.split(/\r?\n/);
        const dataLines = [];

        for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            // FIX: Preserve spaces after "data:".
            const value = line.slice(5);

            dataLines.push(value);
        }

        if (dataLines.length === 0) return;

        const data = dataLines.join("\n");

        if (data.trim() === "[DONE]") return;

        output += data;
        render();
    }

    while (true) {
        const { value, done } = await reader.read();

        buffer += decoder.decode(
            value || new Uint8Array(),
            { stream: !done }
        );

        // Detect SSE if Content-Type is missing.
        if (!isSSE && /^\s*data:/.test(buffer)) {
            isSSE = true;
        }

        if (isSSE) {
            // SSE events are separated by a blank line.
            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() || "";

            for (const event of events) {
                processEvent(event);
            }
        } else {
            // Plain text chunks are appended unchanged.
            output += buffer;
            buffer = "";
            render();
        }

        if (done) break;
    }

    // Process the final event if there is no trailing blank line.
    if (isSSE && buffer.trim()) {
        processEvent(buffer);
    }

    target.textNode.textContent =
        output.length > 0
            ? output
            : "The API returned an empty response.";

    scrollToBottom();
}

async function sendMessage(message) {
    const prompt = message.trim();

    if (!prompt || isSending) return;

    addMessage("user", prompt);

    input.value = "";
    updateInput();

    saveHistory(prompt);
    setBusy(true);

    const reply = addMessage("assistant");

    const dots = document.createElement("span");
    dots.className = "typing-dots";

    for (let i = 0; i < 3; i++) {
        dots.appendChild(document.createElement("i"));
    }

    reply.bubble.appendChild(dots);

    try {
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "text/plain",
                "Accept": "text/event-stream, text/plain"
            },

            body: prompt
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        dots.remove();

        await readResponse(response, reply);

        // Remove existing metadata to prevent duplicates.
        reply.bubble
            .querySelectorAll(".message-meta")
            .forEach((meta) => meta.remove());

        // Add Copy and timestamp only once.
        addMessageMeta(reply.bubble, reply.textNode);

    } catch (error) {
        reply.bubble.replaceChildren();

        const errorText = document.createElement("div");

        errorText.textContent =
            "Unable to connect to the API. Make sure your Spring Boot server is running on port 8080.";

        reply.bubble.appendChild(errorText);

        showToast("API connection failed");
        console.error("Chat API error:", error);

    } finally {
        setBusy(false);
        input.focus();
    }
}
form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
});

input.addEventListener("input", updateInput);

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

$("#newChatBtn").addEventListener("click", () => {
    messages.replaceChildren();

    const welcome = document.createElement("div");
    welcome.className = "welcome";
    welcome.id = "welcomeBlock";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "✳";

    const heading = document.createElement("h1");
    heading.textContent = "How can I help you today?";

    const subtitle = document.createElement("p");
    subtitle.textContent = "Ask me anything.";

    welcome.append(icon, heading, subtitle);
    messages.appendChild(welcome);

    sidebar.classList.remove("open");

    input.value = "";
    updateInput();
    input.focus();
});

$("#themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    localStorage.setItem(
        "aiTheme",
        isDark ? "dark" : "light"
    );

    $("#themeIcon").textContent = isDark ? "☀" : "☾";
    $("#themeLabel").textContent = isDark
        ? "Light mode"
        : "Dark mode";
});

$("#mobileMenu").addEventListener("click", () => {
    sidebar.classList.remove("open");
});

$("#openSidebar").addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

const savedTheme = localStorage.getItem("aiTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
}

const darkMode = document.body.classList.contains("dark");

$("#themeIcon").textContent = darkMode ? "☀" : "☾";
$("#themeLabel").textContent = darkMode
    ? "Light mode"
    : "Dark mode";

renderHistory();
updateInput();