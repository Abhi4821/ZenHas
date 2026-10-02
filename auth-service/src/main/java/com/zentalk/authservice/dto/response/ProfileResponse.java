package com.zentalk.authservice.dto.response;
import com.zentalk.authservice.enums.Gender;
import java.time.Instant;

public record ProfileResponse(
        String userId, String name, String email, Gender gender, String profilePhotoUrl,
        LocationItem country, LocationItem state, LocationItem city,
        long communicationSeconds, String communicationTime, int profileCompletion,
        Instant createdAt, Instant lastLoginAt
) {}
