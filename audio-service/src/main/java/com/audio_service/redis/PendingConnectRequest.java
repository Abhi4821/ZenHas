package com.audio_service.redis;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingConnectRequest {

    private String requestId;

    private String senderId;

    private String receiverId;

    private long createdAt;

}