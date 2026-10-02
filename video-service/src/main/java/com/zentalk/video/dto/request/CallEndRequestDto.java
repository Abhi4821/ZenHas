package com.zentalk.video.dto.request;

import com.zentalk.video.enums.CallEndReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CallEndRequestDto(
        @NotBlank String sessionId,
        @NotNull CallEndReason reason) {}
