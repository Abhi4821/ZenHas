package com.audio_service.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
@RequiredArgsConstructor
public class RedisPubSubConfig {

    public static final String AUDIO_QUEUE_TOPIC =
            "audio.queue.events";

    public static final String AUDIO_CALL_TOPIC =
            "audio.call.events";

    @Bean
    public ChannelTopic queueTopic() {
        return new ChannelTopic(AUDIO_QUEUE_TOPIC);

    }

    @Bean
    public ChannelTopic callTopic() {

        return new ChannelTopic(AUDIO_CALL_TOPIC);

    }

    @Bean
    public MessageListenerAdapter listenerAdapter(
            RedisMessageSubscriber subscriber) {

        return new MessageListenerAdapter(
                subscriber,
                "receiveMessage"
        );

    }

    @Bean
    public RedisMessageListenerContainer redisContainer(

            RedisConnectionFactory connectionFactory,

            MessageListenerAdapter adapter,

            ChannelTopic queueTopic,

            ChannelTopic callTopic) {

        RedisMessageListenerContainer container =
                new RedisMessageListenerContainer();

        container.setConnectionFactory(connectionFactory);

        container.addMessageListener(adapter, queueTopic);

        container.addMessageListener(adapter, callTopic);

        return container;

    }

}