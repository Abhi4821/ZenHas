package com.zentalk.video.signaling;

public record IceCandidateMessage(
        String sessionId,
        String candidate,
        String sdpMid,
        Integer sdpMLineIndex) {}
