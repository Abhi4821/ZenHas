package com.zentalk.video.websocket;

import com.zentalk.video.dto.response.CallEventDto;
import com.zentalk.video.service.VideoSessionService;
import com.zentalk.video.signaling.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.*;

@Controller
@RequiredArgsConstructor
public class SignalingController {
    private final SimpMessagingTemplate messagingTemplate;
    private final VideoSessionService sessionService;

    @MessageMapping("/offer")
    public void offer(SdpOfferMessage message, StompHeaderAccessor accessor) {
        forward(accessor, message.sessionId(),
                "/topic/video/call/" + message.sessionId() + "/offer", message);
    }

    @MessageMapping("/answer")
    public void answer(SdpAnswerMessage message, StompHeaderAccessor accessor) {
        forward(accessor, message.sessionId(),
                "/topic/video/call/" + message.sessionId() + "/answer", message);
    }

    @MessageMapping("/ice")
    public void ice(IceCandidateMessage message, StompHeaderAccessor accessor) {
        forward(accessor, message.sessionId(),
                "/topic/video/call/" + message.sessionId() + "/ice", message);
    }

    private void forward(StompHeaderAccessor accessor, String sessionId,
                         String destination, Object payload) {
        Object user = accessor.getSessionAttributes() == null
                ? null : accessor.getSessionAttributes().get("userId");

        if (user == null || !sessionService.isMember(user.toString(), sessionId)) {
            return;
        }
        messagingTemplate.convertAndSend(destination, payload);
    }
}
