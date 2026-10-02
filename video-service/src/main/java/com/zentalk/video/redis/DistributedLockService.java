package com.zentalk.video.redis;

import lombok.RequiredArgsConstructor;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class DistributedLockService {
    private final RedissonClient redissonClient;

    public <T> T execute(String key, Supplier<T> action) {
        RLock lock = redissonClient.getLock(key);
        boolean acquired = false;
        try {
            acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
            if (!acquired) throw new IllegalStateException("Unable to acquire Redis lock: " + key);
            return action.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) lock.unlock();
        }
    }

    public void execute(String key, Runnable action) {
        execute(key, () -> {
            action.run();
            return null;
        });
    }
}
