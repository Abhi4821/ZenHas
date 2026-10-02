package com.audio_service.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisMessageSubscriber {

    private final SimpMessagingTemplate messagingTemplate;

    private final ObjectMapper objectMapper;

    public void receiveMessage(Object message){

        try{

            String json =
                    objectMapper.writeValueAsString(message);

            messagingTemplate.convertAndSend(

                    "/topic/audio/events",

                    json

            );

            log.debug(
                    "Redis Event Published To WebSocket : {}",
                    json
            );

        }
        catch (Exception ex){

            log.error(
                    "Redis subscriber error",
                    ex
            );

        }

    }

}