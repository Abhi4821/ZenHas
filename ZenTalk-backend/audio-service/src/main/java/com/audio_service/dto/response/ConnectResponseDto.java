package com.audio_service.dto.response;

import com.audio_service.enums.ConnectRequestStatus;
import lombok.Data;

@Data
public class ConnectResponseDto {

    private String requestId;

    private ConnectRequestStatus status;

    private String message;

}