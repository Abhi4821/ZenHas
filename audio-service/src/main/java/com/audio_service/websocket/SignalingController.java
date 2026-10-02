package com.audio_service.websocket;

import com.audio_service.signaling.IceCandidateMessage;
import com.audio_service.signaling.SdpAnswerMessage;
import com.audio_service.signaling.SdpOfferMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/offer")
    public void offer(
            SdpOfferMessage message) {

        messagingTemplate.convertAndSend(

                "/topic/call/"
                        + message.getRoomId()
                        + "/offer",

                message

        );

    }

    @MessageMapping("/answer")
    public void answer(
            SdpAnswerMessage message) {

        messagingTemplate.convertAndSend(

                "/topic/call/"
                        + message.getRoomId()
                        + "/answer",

                message

        );

    }

    @MessageMapping("/ice")
    public void ice(
            IceCandidateMessage message) {

        messagingTemplate.convertAndSend(

                "/topic/call/"
                        + message.getRoomId()
                        + "/ice",

                message

        );

    }

}