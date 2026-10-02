package com.zentalk.video.service.impl;

import com.zentalk.video.dto.request.ConnectRequestDto;
import com.zentalk.video.dto.response.*;
import com.zentalk.video.entity.VideoRequest;
import com.zentalk.video.enums.ConnectRequestStatus;
import com.zentalk.video.exception.VideoServiceException;
import com.zentalk.video.redis.DistributedLockService;
import com.zentalk.video.redis.RedisKeyConstants;
import com.zentalk.video.redis.RoomQueueRepository;
import com.zentalk.video.repository.VideoRequestRepository;
import com.zentalk.video.service.ConnectRequestService;
import com.zentalk.video.service.RoomQueueService;
import com.zentalk.video.service.VideoSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConnectRequestServiceImpl implements ConnectRequestService {
    private final VideoRequestRepository requestRepository;
    private final RoomQueueRepository queue;
    private final RoomQueueService queueService;
    private final VideoSessionService sessionService;
    private final DistributedLockService lockService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${video.request-timeout-seconds:30}")
    private long timeoutSeconds;

    @Override
    public ConnectResponseDto sendRequest(String senderId, ConnectRequestDto request) {
        String target = request.targetUserId();
        if (senderId.equals(target)) throw new VideoServiceException("Cannot connect to yourself");

        return lockService.execute(RedisKeyConstants.USER_STATUS + senderId, () -> {
            List<VideoRequest> outgoing =
                    requestRepository.findBySenderUserIdAndStatus(senderId, ConnectRequestStatus.PENDING);
            if (!outgoing.isEmpty())
                throw new VideoServiceException("You already have a pending connect request", HttpStatus.CONFLICT);

            if (!queue.isUserQueued(senderId))
                throw new VideoServiceException("Sender is not in video waiting room", HttpStatus.CONFLICT);

            // Target may have been removed from the queue immediately after another request.
            // A short race is handled by allowing requests while the receiver still has no active call.
            String requestId = UUID.randomUUID().toString().replace("-", "");
            Instant now = Instant.now();

            VideoRequest vr = VideoRequest.builder()
                    .requestId(requestId)
                    .senderUserId(senderId)
                    .receiverUserId(target)
                    .status(ConnectRequestStatus.PENDING)
                    .createdAt(now)
                    .updatedAt(now)
                    .expiresAt(now.plusSeconds(timeoutSeconds))
                    .build();
            requestRepository.save(vr);

            // Sender stays in queue. Receiver is removed from queue for UI consistency.
            queueService.exitQueue(target);

            messagingTemplate.convertAndSend("/topic/video/events",
                    new RequestNotificationDto("REQUEST_RECEIVED", requestId, senderId, target, "PENDING"));

            return new ConnectResponseDto(requestId, "PENDING", "Connect request sent successfully");
        });
    }

    @Override
    @Transactional
    public ConnectResponseDto cancelRequest(String senderId, String requestId) {
        VideoRequest vr = findPending(requestId);
        if (!senderId.equals(vr.getSenderUserId()))
            throw new VideoServiceException("Only sender can cancel this request", HttpStatus.FORBIDDEN);

        return lockService.execute(RedisKeyConstants.USER_STATUS + senderId, () -> {
            vr.setStatus(ConnectRequestStatus.CANCELLED);
            requestRepository.save(vr);
            queueService.exitQueue(senderId);

            messagingTemplate.convertAndSend("/topic/video/events",
                    new RequestNotificationDto("REQUEST_CANCELLED", requestId,
                            vr.getSenderUserId(), vr.getReceiverUserId(), "CANCELLED"));
            return new ConnectResponseDto(requestId, "CANCELLED", "Connect request cancelled");
        });
    }

    @Override
    @Transactional
    public VideoSessionCreatedResponse acceptRequest(String receiverId, String requestId) {
        VideoRequest vr = findPending(requestId);
        if (!receiverId.equals(vr.getReceiverUserId()))
            throw new VideoServiceException("Only receiver can accept this request", HttpStatus.FORBIDDEN);

        return lockService.execute(RedisKeyConstants.USER_STATUS + receiverId, () -> {
            List<VideoRequest> incoming =
                    requestRepository.findByReceiverUserIdAndStatus(receiverId, ConnectRequestStatus.PENDING);

            vr.setStatus(ConnectRequestStatus.ACCEPTED);
            requestRepository.save(vr);

            // Receiver accepts one; all other incoming requests are terminated.
            for (VideoRequest other : incoming) {
                if (!other.getRequestId().equals(requestId)) {
                    other.setStatus(ConnectRequestStatus.TERMINATED);
                    requestRepository.save(other);
                    messagingTemplate.convertAndSend("/topic/video/events",
                            new RequestNotificationDto("REQUEST_TERMINATED",
                                    other.getRequestId(), other.getSenderUserId(),
                                    receiverId, "TERMINATED"));
                    queueService.exitQueue(other.getSenderUserId());
                }
            }

            queueService.exitQueue(receiverId);
            queueService.exitQueue(vr.getSenderUserId());

            VideoSessionCreatedResponse response =
                    sessionService.createSession(vr.getSenderUserId(), receiverId);

            messagingTemplate.convertAndSend("/topic/video/events",
                    new RequestNotificationDto("REQUEST_ACCEPTED", requestId,
                            vr.getSenderUserId(), receiverId, "ACCEPTED"));

            return response;
        });
    }

    @Override
    @Transactional
    public ConnectResponseDto rejectRequest(String receiverId, String requestId) {
        VideoRequest vr = findPending(requestId);
        if (!receiverId.equals(vr.getReceiverUserId()))
            throw new VideoServiceException("Only receiver can reject this request", HttpStatus.FORBIDDEN);

        vr.setStatus(ConnectRequestStatus.REJECTED);
        requestRepository.save(vr);
        queueService.exitQueue(vr.getSenderUserId());

        messagingTemplate.convertAndSend("/topic/video/events",
                new RequestNotificationDto("REQUEST_REJECTED", requestId,
                        vr.getSenderUserId(), receiverId, "REJECTED"));

        return new ConnectResponseDto(requestId, "REJECTED", "Connect request rejected");
    }

    private VideoRequest findPending(String requestId) {
        VideoRequest vr = requestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new VideoServiceException("Request not found", HttpStatus.NOT_FOUND));
        if (vr.getStatus() != ConnectRequestStatus.PENDING)
            throw new VideoServiceException("Request is no longer pending", HttpStatus.CONFLICT);
        return vr;
    }
}
