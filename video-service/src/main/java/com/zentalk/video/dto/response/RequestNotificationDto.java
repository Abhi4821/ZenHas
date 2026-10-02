package com.zentalk.video.dto.response;

public record RequestNotificationDto(
        String eventType,
        String requestId,
        String senderUserId,
        String receiverUserId,
        String status) {}
