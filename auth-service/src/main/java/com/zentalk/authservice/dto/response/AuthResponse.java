package com.zentalk.authservice.dto.response;
public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, ProfileResponse user) {}
