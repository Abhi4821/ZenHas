package com.audio_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConnectRequestDto {

    @NotBlank
    private String targetUserId;

}