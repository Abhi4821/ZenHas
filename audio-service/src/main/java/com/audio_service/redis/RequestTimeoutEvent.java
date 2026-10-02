package com.audio_service.redis;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequestTimeoutEvent {

    private String requestId;

    private String senderId;

    private String receiverId;

}