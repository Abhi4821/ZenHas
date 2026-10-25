package com.audio_service.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisMessagePublisher {

    private final RedisTemplate<String,Object> redisTemplate;

    private final ChannelTopic queueTopic;

    private final ChannelTopic callTopic;

    public void publishQueueEvent(Object event){

        redisTemplate.convertAndSend(

                queueTopic.getTopic(),

                event

        );

    }

    public void publishCallEvent(Object event){

        redisTemplate.convertAndSend(

                callTopic.getTopic(),

                event

        );

    }

}