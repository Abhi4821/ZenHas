package com.audio_service.dto.request;

import com.audio_service.enums.CallEndReason;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CallEndRequestDto {

    @NotBlank
    private String roomId;

    private CallEndReason reason;

}