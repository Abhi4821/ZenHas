package com.zentalk.video.signaling;

public record SdpOfferMessage(String sessionId, String sdp) {}
