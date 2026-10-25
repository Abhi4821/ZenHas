package com.zentalk.video.scheduler;

import com.zentalk.video.entity.VideoRequest;
import com.zentalk.video.enums.ConnectRequestStatus;
import com.zentalk.video.redis.RoomQueueRepository;
import com.zentalk.video.repository.VideoRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class RequestTimeoutScheduler {
    private final VideoRequestRepository repository;
    private final RoomQueueRepository queue;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void timeoutRequests() {
        for (VideoRequest request :
                repository.findByStatusAndExpiresAtBefore(
                        ConnectRequestStatus.PENDING, Instant.now())) {

            request.setStatus(ConnectRequestStatus.TIMED_OUT);
            repository.save(request);

            queue.removeUser(request.getSenderUserId());

            messagingTemplate.convertAndSend("/topic/video/events",
                    new com.zentalk.video.dto.response.RequestNotificationDto(
                            "REQUEST_TIMED_OUT",
                            request.getRequestId(),
                            request.getSenderUserId(),
                            request.getReceiverUserId(),
                            "TIMED_OUT"));
        }
    }
}
