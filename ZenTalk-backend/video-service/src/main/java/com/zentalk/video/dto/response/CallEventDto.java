package com.zentalk.video.dto.response;

public record CallEventDto(
        String eventType,
        String sessionId,
        String userA,
        String userB,
        String reason) {}
