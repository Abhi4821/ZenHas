package com.zentalk.video.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisMessagePublisher {
    private final RedisTemplate<String, Object> redisTemplate;

    public void publishQueueEvent(Object event) {
        redisTemplate.convertAndSend("video.queue.events", event);
    }

    public void publishCallEvent(Object event) {
        redisTemplate.convertAndSend("video.call.events", event);
    }
}
