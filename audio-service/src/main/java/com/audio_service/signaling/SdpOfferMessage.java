package com.audio_service.signaling;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SdpOfferMessage {
    private String roomId;
    private String senderId;
    private String targetUserId;
    private String sdp;

}
