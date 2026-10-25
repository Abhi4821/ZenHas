package com.zentalk.video.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisMessageSubscriber {
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public void receiveMessage(Object message) {
        try {
            String json = objectMapper.writeValueAsString(message);
            messagingTemplate.convertAndSend("/topic/video/events", json);
        } catch (Exception ignored) {
            // Keep Redis listener alive; application events are best-effort fanout.
        }
    }
}
