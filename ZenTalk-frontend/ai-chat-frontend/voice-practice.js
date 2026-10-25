
const CHAT_API = "http://localhost:8080/api/chat";
const WHISPER_API = "http://127.0.0.1:8001/transcribe";

const $ = (selector) => document.querySelector(selector);

const micBtn = $("#micBtn");
const stopBtn = $("#stopBtn");
const practiceBtn = $("#practiceBtn");
const handsFreeBtn = $("#handsFreeBtn");
const replayBtn = $("#replayBtn");
const voiceOrb = $("#voiceOrb");

let mode = "practice";
let mediaStream = null;
let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let animationId = null;

let recording = false;
let processing = false;
let stopping = false;
let handsFreeEnabled = false;
let speechStarted = false;
let silenceStarted = 0;
let recordingStartedAt = 0;
let lastReply = "";
let sessionNumber = 0;
let hasWelcomed = false;

const MAX_RECORDING_MS = 20000;
const SILENCE_MS = 1400;
const SILENCE_THRESHOLD = 0.018;

function setStatus(title, detail = "") {
    $("#statusText").textContent = title;
    $("#statusDetail").textContent = detail;
    $("#connectionStatus").textContent = title;
}

function showError(message) {
    $("#errorText").textContent = message;
}

function setOrb(state) {
    voiceOrb.classList.remove("listening", "speaking");

    if (state === "listening") {
        voiceOrb.classList.add("listening");
    }

    if (state === "speaking") {
        voiceOrb.classList.add("speaking");
    }
}

function selectMode(nextMode) {
    mode = nextMode;
    practiceBtn.classList.toggle("active", mode === "practice");
    handsFreeBtn.classList.toggle("active", mode === "handsfree");

    if (mode === "practice") {
        handsFreeEnabled = false;
        setStatus("English Practice", "Tap Start speaking when you're ready.");
    } else {
        setStatus("Hands-free mode", "Start speaking. The next turns will run automatically.");
    }
}

practiceBtn.addEventListener("click", () => {
    if (recording || processing) return;
    selectMode("practice");
});

handsFreeBtn.addEventListener("click", () => {
    if (recording || processing) return;
    selectMode("handsfree");
});

async function getMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
            "Microphone access is unavailable. Open this page on localhost or HTTPS in a supported browser."
        );
    }

    if (!mediaStream) {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
    }

    return mediaStream;
}

async function startRecording() {
    if (recording || processing || stopping) return;

    showError("");

    try {
        const stream = await getMicrophone();

        if (!window.MediaRecorder) {
            throw new Error("This browser does not support audio recording.");
        }

        audioChunks = [];

        const options = {};

        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            options.mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            options.mimeType = "audio/webm";
        }

        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.addEventListener("dataavailable", (event) => {
            if (event.data && event.data.size > 0) {
                audioChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener("stop", handleRecordingStopped, {
            once: true
        });

        mediaRecorder.start(250);

        recording = true;
        speechStarted = false;
        silenceStarted = 0;
        recordingStartedAt = Date.now();

        micBtn.disabled = true;
        stopBtn.disabled = false;

        setOrb("listening");
        setStatus("Listening...", "Speak clearly. Pause when you finish.");

        await startSilenceDetection(stream);

    } catch (error) {
        showError(error.message || "Could not start the microphone.");
        setStatus("Microphone unavailable", "Check browser permissions and try again.");
        stopBtn.disabled = true;
        micBtn.disabled = false;
        handsFreeEnabled = false;
    }
}

async function startSilenceDetection(stream) {
    if (audioContext) {
        try {
            await audioContext.close();
        } catch { }
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();

    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);

    const samples = new Uint8Array(analyser.fftSize);

    function monitor() {
        if (!recording || !analyser) return;

        analyser.getByteTimeDomainData(samples);

        let sum = 0;

        for (const sample of samples) {
            const normalized = (sample - 128) / 128;
            sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / samples.length);
        const now = Date.now();

        if (rms > SILENCE_THRESHOLD) {
            speechStarted = true;
            silenceStarted = 0;
            setStatus("Listening...", "I'm hearing you. Keep speaking.");
        } else if (speechStarted) {
            if (!silenceStarted) silenceStarted = now;

            if (now - silenceStarted >= SILENCE_MS) {
                stopRecording();
                return;
            }
        }

        if (now - recordingStartedAt >= MAX_RECORDING_MS) {
            stopRecording();
            return;
        }

        animationId = requestAnimationFrame(monitor);
    }

    animationId = requestAnimationFrame(monitor);
}

function stopRecording() {
    if (!recording || !mediaRecorder || stopping) return;

    stopping = true;
    recording = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
}

async function handleRecordingStopped() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (audioContext) {
        try {
            await audioContext.close();
        } catch { }
        audioContext = null;
        analyser = null;
    }

    recording = false;
    stopping = false;
    stopBtn.disabled = true;

    const recorder = mediaRecorder;
    mediaRecorder = null;

    const mimeType = recorder?.mimeType || "audio/webm";
    const blob = new Blob(audioChunks, { type: mimeType });
    audioChunks = [];

    if (blob.size === 0) {
        micBtn.disabled = false;
        setStatus("No audio captured", "Please try speaking again.");

        if (handsFreeEnabled) {
            scheduleNextRecording();
        }
        return;
    }

    await transcribeAndChat(blob);
}

async function transcribeAndChat(blob) {
    processing = true;
    micBtn.disabled = true;

    const thisSession = sessionNumber;

    try {
        setStatus("Processing your voice...", "Please wait a moment.");
        setOrb("");

        const formData = new FormData();

        const extension = blob.type.includes("mp4") ? "m4a" : "webm";
        formData.append("file", blob, `speech.${extension}`);

        const transcriptionResponse = await fetch(WHISPER_API, {
            method: "POST",
            body: formData
        });

        if (!transcriptionResponse.ok) {
            throw new Error(
                `Whisper transcription failed: HTTP ${transcriptionResponse.status}`
            );
        }

        const transcriptionData = await transcriptionResponse.json();
        console.log("Whisper transcript:", transcriptionData.text);
        const transcript = String(transcriptionData.text || "").trim();

        if (!transcript) {
            $("#transcriptText").textContent = "No speech detected.";
            setStatus("No speech detected", "Try again and speak a little louder.");
            return;
        }

        $("#transcriptText").textContent = transcript;

        setStatus("Thinking...", "Your AI partner is preparing a reply.");


        const prompt = mode === "practice"
    ? `You are my English teacher and interview coach. Be respectful, patient, and encouraging. Use simple English and reply in 2–5 sentences. Understand my meaning despite mistakes; gently correct important errors with a better sentence and brief explanation. Teach practical, professional English. For interview practice, adapt to my target role, ask one question at a time, and evaluate my English and answer. Continue naturally and ask one follow-up question.

My message: ${transcript}`
    : `You are my friendly English conversation partner. Use simple English and reply in 1–4 sentences. Gently correct important mistakes when useful. Teach practical English, continue naturally, and ask one relevant follow-up question. For interview practice, ask one role-specific question at a time and evaluate my answer.

My message: ${transcript}`;


        const response = await fetch(CHAT_API, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
                "Accept": "text/event-stream, text/plain"
            },
            body: prompt
        });

        if (!response.ok) {
            throw new Error(`Chat API failed: HTTP ${response.status}`);
        }

        const reply = await readChatResponse(response, thisSession);
        console.log("AI reply received:", reply);

        if (!reply.trim()) {
            throw new Error("The AI returned an empty response.");
        }

        if (thisSession !== sessionNumber) return;

        lastReply = reply.trim();
        $("#replyText").textContent = lastReply;
        replayBtn.disabled = false;

        // await speakReply(lastReply, thisSession);

    } catch (error) {
        console.error("Voice conversation error:", error);

        showError(
            `${error.message || "Something went wrong."} Check that both backend servers are running and that CORS permits this page.`
        );

        setStatus("Something went wrong", "Check the error message and try again.");

    } finally {
        processing = false;
        micBtn.disabled = false;

        if (handsFreeEnabled && thisSession === sessionNumber) {
            scheduleNextRecording();
        } else if (!handsFreeEnabled) {
            setOrb("");
            micBtn.textContent = "🎙 Start speaking";

            if (!showingError()) {
                setStatus("Your turn", "Tap Start speaking to continue.");
            }
        }
    }
}

function showingError() {
    return Boolean($("#errorText").textContent);
}

async function readChatResponse(response, thisSession) {
    const contentType = (
        response.headers.get("content-type") || ""
    ).toLowerCase();

    if (!response.body) {
        const text = await response.text();
        $("#replyText").textContent = text;
        return text;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let output = "";
    let buffer = "";
    let speechBuffer = "";
    let speechQueue = Promise.resolve();

    function queueSpeech(sentence) {
        const text = sentence.trim();
        if (!text || thisSession !== sessionNumber) return;

        speechQueue = speechQueue.then(() => {
            if (thisSession !== sessionNumber) return;
            return speakStreamChunk(text, thisSession);
        });
    }

    function processText(text) {
        if (!text) return;

        output += text;

        // output += content.trim();

        // Display text immediately as it arrives
        $("#replyText").textContent = output;

        // Prepare complete sentences for spoken playback
        speechBuffer += text;

        const sentencePattern = /^([\s\S]*?[.!?]+(?:["')\]]*)\s+)/;

        while (true) {
            const match = speechBuffer.match(sentencePattern);
            if (!match) break;

            queueSpeech(match[1]);
            speechBuffer = speechBuffer.slice(match[1].length);
        }
    }

    function processEvent(event) {
        const dataLines = event
            .split(/\r?\n/)
            .filter(line => line.startsWith("data:"))
            .map(line => line.slice(5));


        if (!dataLines.length) return;

        const data = dataLines.join("\n");

        if (data.trim() === "[DONE]" || !data) return;

        processText(data);
    }

    const isSSE = contentType.includes("text/event-stream");

    while (true) {
        const { value, done } = await reader.read();

        buffer += decoder.decode(value || new Uint8Array(), {
            stream: !done
        });

        if (isSSE || /^\s*data:/.test(buffer)) {
            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() || "";

            for (const event of events) {
                processEvent(event);
            }
        } else {
            processText(buffer);
            buffer = "";
        }

        if (done) break;
    }

    if (buffer.trim()) {
        if (isSSE || buffer.trimStart().startsWith("data:")) {
            processEvent(buffer);
        } else {
            processText(buffer);
        }
    }

    // Speak any remaining text that doesn't end with punctuation
    if (speechBuffer.trim()) {
        queueSpeech(speechBuffer);
    }

    // Wait for queued speech to finish before returning
    await speechQueue;

    return output;
}

function speakStreamChunk(text, thisSession) {
    return new Promise((resolve) => {
        if (
            !("speechSynthesis" in window) ||
            thisSession !== sessionNumber
        ) {
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getSelectedAccent();

        const selectedVoice = getAccentVoice();
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 0.95;

        utterance.onstart = () => {
            if (thisSession !== sessionNumber) return;

            setOrb("speaking");
            setStatus(
                "AI is speaking...",
                "Listen, then reply when it's your turn."
            );
        };

        utterance.onend = () => {
            if (thisSession === sessionNumber) {
                setOrb("");
            }
            resolve();
        };

        utterance.onerror = () => {
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

// async function readChatResponse(response) {
//     const contentType = (
//         response.headers.get("content-type") || ""
//     ).toLowerCase();

//     if (!response.body) {
//         return await response.text();
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();

//     let output = "";
//     let buffer = "";

//     function processEvent(event) {
//         const dataLines = event
//             .split(/\r?\n/)
//             .filter(line => line.startsWith("data:"))
//             .map(line => line.slice(5));

//         if (!dataLines.length) return;

//         const data = dataLines.join("\n");

//         if (data.trim() === "[DONE]") return;

//         output += data;
//     }

//     const isSSE = contentType.includes("text/event-stream");

//     while (true) {
//         const { value, done } = await reader.read();

//         buffer += decoder.decode(value || new Uint8Array(), {
//             stream: !done
//         });

//         if (isSSE || /^\s*data:/.test(buffer)) {
//             const events = buffer.split(/\r?\n\r?\n/);
//             buffer = events.pop() || "";

//             for (const event of events) {
//                 processEvent(event);
//             }
//         } else {
//             output += buffer;
//             buffer = "";
//         }

//         if (done) break;
//     }

//     if (buffer.trim()) {
//         if (isSSE || buffer.trimStart().startsWith("data:")) {
//             processEvent(buffer);
//         } else {
//             output += buffer;
//         }
//     }

//     return output;
// }
function getSelectedAccent() {
    const accentSelect = document.getElementById("accentSelect");

    // Dropdown na mile to default accent use karo
    return accentSelect ? accentSelect.value : "en-US";
}

function getAccentVoice() {
    const accent = getSelectedAccent();
    const voices = window.speechSynthesis.getVoices();

    return voices.find(voice => voice.lang === accent)
        || voices.find(voice => voice.lang.startsWith(accent))
        || null;
}

function speakReply(text, thisSession) {
    return new Promise((resolve) => {
        if (!("speechSynthesis" in window)) {
            setStatus("Reply ready", "Your browser does not support spoken replies.");
            resolve();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getSelectedAccent();
        const selectedVoice = getAccentVoice();
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.rate = 0.95;

        utterance.onstart = () => {
            if (thisSession !== sessionNumber) return;
            setOrb("speaking");
            setStatus("AI is speaking...", "Listen, then reply when it's your turn.");
        };

        utterance.onend = () => {
            if (thisSession === sessionNumber) {
                setOrb("");
                setStatus("Your turn", "You can respond now.");
            }
            resolve();
        };

        utterance.onerror = () => {
            setOrb("");
            resolve();
        };

        window.speechSynthesis.speak(utterance);
        console.log("Speech synthesis called:", text);
    });
}


async function startConversation() {
    const welcomeMessages = [
        "Hello! I'm your English teacher and communication coach. Let's improve your English together. Tell me, how was your day?",
        
        "Hey there! Welcome to your English practice session. I'm here to help you speak naturally and confidently. What would you like to talk about today?",
        
        "Hi! It's great to have you here. Today, we'll work on your communication skills. Could you tell me a little about yourself?",
        
        "Hello! Ready to boost your English speaking skills? Don't worry about making mistakes. Let's start with something simple. What do you usually do in your free time?",
        
        "Welcome back! Let's make today's practice interesting. Imagine we're meeting for the first time. How would you introduce yourself?",
        
        "Hi there! I'm excited to practice English with you. We'll focus on fluency, confidence, and natural conversation. How has your day been so far?"
    ];

    // Select a random message
    const randomIndex = Math.floor(
        Math.random() * welcomeMessages.length
    );

    const welcomeMessage = welcomeMessages[randomIndex];

    lastReply = welcomeMessage;
    $("#replyText").textContent = welcomeMessage;
    replayBtn.disabled = false;

    setStatus("AI is introducing itself...", "Please listen.");

    await speakReply(welcomeMessage, sessionNumber);
}



function scheduleNextRecording() {
    if (!handsFreeEnabled || recording || processing) return;

    micBtn.textContent = "🎙 Listening automatically";
    setStatus("Your turn", "Starting the microphone...");

    window.setTimeout(() => {
        if (handsFreeEnabled && !recording && !processing) {
            startRecording();
        }
    }, 700);
}
micBtn.addEventListener("click", async () => {
    if (recording || processing || stopping) return;

    showError("");
    handsFreeEnabled = mode === "handsfree";

    try {
        // AI introduction: only once per page session
        if (!hasWelcomed) {
            micBtn.disabled = true;

            await getMicrophone();
            await startConversation();

            hasWelcomed = true;
        }

        // Start recording after AI finishes speaking
        await startRecording();

    } catch (error) {
        console.error("Start button error:", error);
        showError(error.message || "Could not start the conversation.");
        setStatus("Unable to start", "Please try again.");
        handsFreeEnabled = false;

    } finally {
        micBtn.disabled = false;
    }
});


stopBtn.addEventListener("click", () => {
    handsFreeEnabled = false;
    window.speechSynthesis?.cancel();

    if (recording) {
        stopRecording();
    } else {
        processing = false;
        micBtn.disabled = false;
        setOrb("");
        setStatus("Stopped", "Tap Start speaking to continue.");
    }
});

replayBtn.addEventListener("click", () => {
    if (lastReply) {
        speakReply(lastReply, sessionNumber);
    }
});

window.addEventListener("pagehide", () => {
    sessionNumber++;
    handsFreeEnabled = false;

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    window.speechSynthesis?.cancel();

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }

    if (audioContext) {
        audioContext.close().catch(() => { });
    }
});

selectMode("practice");
