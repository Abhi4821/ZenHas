package com.zentalk.video.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ConnectRequestDto(@NotBlank String targetUserId) {}
