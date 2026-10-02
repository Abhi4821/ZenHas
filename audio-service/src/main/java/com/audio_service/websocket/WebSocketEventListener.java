package com.audio_service.websocket;

import com.audio_service.service.RoomQueueService;
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
    public void handleDisconnect(
            SessionDisconnectEvent event) {

        StompHeaderAccessor accessor =
                StompHeaderAccessor.wrap(
                        event.getMessage());

        Object userId =
                accessor.getSessionAttributes()
                        .get("userId");

        if (userId == null) {

            return;

        }

        try {

            if (roomQueueService.isInQueue(
                    userId.toString())) {

                roomQueueService.exitQueue(
                        userId.toString());

            }

            log.info(
                    "User disconnected : {}",
                    userId);

        } catch (Exception ex) {

            log.error(
                    "Disconnect cleanup failed",
                    ex);

        }

    }

}