package com.audio_service.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.util.Set;

@Repository
@RequiredArgsConstructor
public class RoomQueueRepository {

    public static final String QUEUE_KEY = "audio:queue";

    public static final String PENDING_REQUEST_KEY = "audio:pending";

    private final RedisTemplate<String,Object> redisTemplate;

    private ZSetOperations<String,Object> zSet(){

        return redisTemplate.opsForZSet();

    }

    private HashOperations<String,Object,Object> hash(){

        return redisTemplate.opsForHash();

    }

    /*
        ==========================
            Queue Operations
        ==========================
     */

    public void addUser(String userId,double score){

        zSet().add(
                QUEUE_KEY,
                userId,
                score
        );

    }

    public void removeUser(String userId){

        zSet().remove(
                QUEUE_KEY,
                userId
        );

    }

    public boolean isUserQueued(String userId){

        return zSet().score(
                QUEUE_KEY,
                userId
        )!=null;

    }

    public Double getScore(String userId){

        return zSet().score(
                QUEUE_KEY,
                userId
        );

    }

    public Long queueSize(){

        return zSet().zCard(
                QUEUE_KEY
        );

    }

    public Set<Object> getTopUsers(long count){

        return zSet().range(
                QUEUE_KEY,
                0,
                count-1
        );

    }

    public Set<Object> getUsersBetween(
            long start,
            long end){

        return zSet().range(
                QUEUE_KEY,
                start,
                end
        );

    }

    /*
        ==========================
        Pending Request
        ==========================
     */

    public Set<Object> getAllPendingRequestIds() {

        return hash().keys(
                PENDING_REQUEST_KEY);

    }
    public void savePendingRequest(
            String requestId,
            PendingConnectRequest request,
            Duration ttl){

        hash().put(
                PENDING_REQUEST_KEY,
                requestId,
                request
        );

        redisTemplate.expire(
                PENDING_REQUEST_KEY,
                ttl
        );

    }


    public Object getPendingRequest(
            String requestId){

        return hash().get(
                PENDING_REQUEST_KEY,
                requestId
        );

    }

    public void removePendingRequest(
            String requestId){

        hash().delete(
                PENDING_REQUEST_KEY,
                requestId
        );

    }

    public boolean pendingExists(
            String requestId){

        return hash().hasKey(
                PENDING_REQUEST_KEY,
                requestId
        );

    }

}