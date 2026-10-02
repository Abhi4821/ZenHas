package com.audio_service.dto.response;

import lombok.Data;

@Data
public class CallRoomCreatedResponse {

    private String roomId;

    private String websocketEndpoint;

    private String signalingTopic;

}