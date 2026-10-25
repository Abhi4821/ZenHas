package com.audio_service.redis;

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
    public <T> T execute(
            String key,
            long waitSeconds,
            long leaseSeconds,
            Supplier<T> supplier){
        RLock lock =
                redissonClient.getLock(key);
        boolean acquired=false;
        try{
            acquired=
                    lock.tryLock(
                            waitSeconds,
                            leaseSeconds,
                            TimeUnit.SECONDS
                    );
            if(!acquired){
                throw new RuntimeException(
                        "Unable to acquire Redis lock : "+key
                );
            }
            return supplier.get();
        }
        catch (InterruptedException e){
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
        finally {
            if(acquired && lock.isHeldByCurrentThread()){
                lock.unlock();
            }
        }
    }
    public void execute(
            String key,
            Runnable runnable){
        execute(
                key,
                5,
                30,
                ()->{
                    runnable.run();
                    return null;
                });
    }
}