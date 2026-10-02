package com.zentalk.video.redis;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.*;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisPubSubConfig {
    @Bean
    ChannelTopic videoQueueTopic() {
        return new ChannelTopic("video.queue.events");
    }

    @Bean
    ChannelTopic videoCallTopic() {
        return new ChannelTopic("video.call.events");
    }

    @Bean
    MessageListenerAdapter videoMessageListenerAdapter(RedisMessageSubscriber subscriber) {
        return new MessageListenerAdapter(subscriber, "receiveMessage");
    }

    @Bean
    RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory factory,
            MessageListenerAdapter adapter,
            ChannelTopic videoQueueTopic,
            ChannelTopic videoCallTopic) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(factory);
        container.addMessageListener(adapter, videoQueueTopic);
        container.addMessageListener(adapter, videoCallTopic);
        return container;
    }
}
