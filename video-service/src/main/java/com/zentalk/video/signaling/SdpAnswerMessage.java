package com.zentalk.video.signaling;

public record SdpAnswerMessage(String sessionId, String sdp) {}
