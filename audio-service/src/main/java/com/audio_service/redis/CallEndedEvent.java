package com.audio_service.redis;

import com.audio_service.enums.CallEndReason;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallEndedEvent {

    private String roomId;

    private String callerId;

    private String receiverId;

    private long durationSeconds;

    private CallEndReason reason;

}