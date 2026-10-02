package com.audio_service.redis;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallCreatedEvent {

    private String roomId;

    private String callerId;

    private String receiverId;
}