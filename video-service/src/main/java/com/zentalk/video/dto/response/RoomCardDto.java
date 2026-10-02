package com.zentalk.video.dto.response;

public record RoomCardDto(
        String userId,
        String username,
        String profileImage,
        Long communicationSeconds) {}
