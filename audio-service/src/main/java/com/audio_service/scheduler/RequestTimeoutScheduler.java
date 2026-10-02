package com.audio_service.scheduler;

import com.audio_service.redis.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class RequestTimeoutScheduler {

    private final RoomQueueRepository roomQueueRepository;

    private final DistributedLockService lockService;

    private final RedisMessagePublisher publisher;

    /**
     * Runs every 5 seconds.
     * Only one instance can execute because of Redisson lock.
     */
    @Scheduled(fixedDelay = 5000)
    public void processExpiredRequests() {

        lockService.execute(

                "scheduler:pending:timeout",

                () -> {

                    scanPendingRequests();

                }

        );

    }

    private void scanPendingRequests() {

        Set<Object> requestIds =
                roomQueueRepository.getAllPendingRequestIds();

        if (requestIds == null || requestIds.isEmpty()) {

            return;

        }

        long currentTime =
                System.currentTimeMillis();

        for (Object id : requestIds) {

            PendingConnectRequest request =
                    (PendingConnectRequest)
                            roomQueueRepository
                                    .getPendingRequest(id.toString());

            if (request == null) {

                continue;

            }

            long age =
                    currentTime - request.getCreatedAt();

            if (age >= 30000) {

                expireRequest(request);

            }

        }

    }

    private void expireRequest(
            PendingConnectRequest request) {

        roomQueueRepository.removePendingRequest(
                request.getRequestId());

        publisher.publishQueueEvent(

                new RequestTimeoutEvent(

                        request.getRequestId(),

                        request.getSenderId(),

                        request.getReceiverId()

                )

        );

        log.info(

                "Connect request expired : {}",

                request.getRequestId()

        );

    }

}