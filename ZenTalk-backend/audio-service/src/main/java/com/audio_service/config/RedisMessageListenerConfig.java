//
//package com.audio_service.config;
//
//import com.audio_service.redis.RedisMessageSubscriber;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.data.redis.connection.RedisConnectionFactory;
//import org.springframework.data.redis.listener.ChannelTopic;
//import org.springframework.data.redis.listener.RedisMessageListenerContainer;
//import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
//
//@Configuration
//public class RedisMessageListenerConfig {
//
//    @Bean
//    public ChannelTopic queueTopic() {
//        return new ChannelTopic("audio:queue:events");
//    }
//
//    @Bean
//    public ChannelTopic callTopic() {
//        return new ChannelTopic("audio:call:events");
//    }
//
//    @Bean
//    public MessageListenerAdapter redisMessageListenerAdapter(
//            RedisMessageSubscriber subscriber) {
//        return new MessageListenerAdapter(
//                subscriber,
//                "receiveMessage"
//        );
//    }
//
//    @Bean
//    public RedisMessageListenerContainer redisMessageListenerContainer(
//            RedisConnectionFactory connectionFactory,
//            MessageListenerAdapter redisMessageListenerAdapter,
//            ChannelTopic queueTopic,
//            ChannelTopic callTopic) {
//
//        RedisMessageListenerContainer container =
//                new RedisMessageListenerContainer();
//
//        container.setConnectionFactory(connectionFactory);
//
//        container.addMessageListener(
//                redisMessageListenerAdapter,
//                queueTopic
//        );
//
//        container.addMessageListener(
//                redisMessageListenerAdapter,
//                callTopic
//        );
//
//        return container;
//    }
//}
