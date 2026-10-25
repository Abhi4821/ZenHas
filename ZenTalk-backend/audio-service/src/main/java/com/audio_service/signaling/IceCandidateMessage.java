package com.audio_service.signaling;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IceCandidateMessage {
    private String roomId;

    private String senderId;

    private String targetUserId;

    private String candidate;

    private String sdpMid;

    private Integer sdpMLineIndex;

}