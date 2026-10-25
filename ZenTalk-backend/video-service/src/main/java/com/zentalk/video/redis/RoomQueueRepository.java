package com.zentalk.video.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Set;

@Repository
@RequiredArgsConstructor
public class RoomQueueRepository {
    private final RedisTemplate<String, Object> redisTemplate;

    public void addUser(String userId, double score) {
        redisTemplate.opsForZSet().add(RedisKeyConstants.QUEUE, userId, score);
    }

    public void removeUser(String userId) {
        redisTemplate.opsForZSet().remove(RedisKeyConstants.QUEUE, userId);
    }

    public boolean isUserQueued(String userId) {
        return redisTemplate.opsForZSet().score(RedisKeyConstants.QUEUE, userId) != null;
    }

    public Set<Object> getUsers(long limit) {
        return redisTemplate.opsForZSet().range(RedisKeyConstants.QUEUE, 0, limit - 1);
    }

    public Long size() {
        return redisTemplate.opsForZSet().zCard(RedisKeyConstants.QUEUE);
    }
}
