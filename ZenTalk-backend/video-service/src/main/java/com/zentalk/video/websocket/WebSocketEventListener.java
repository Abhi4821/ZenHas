package com.zentalk.video.websocket;

import com.zentalk.video.service.RoomQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    private final RoomQueueService roomQueueService;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (accessor.getSessionAttributes() == null) return;

        Object user = accessor.getSessionAttributes().get("userId");
        if (user == null) return;

        try {
            roomQueueService.exitQueue(user.toString());
            log.debug("Video websocket disconnected: {}", user);
        } catch (Exception ex) {
            log.warn("Video disconnect cleanup failed", ex);
        }
    }
}
