package com.audio_service.service.impl;

import com.audio_service.dto.request.ConnectRequestDto;
import com.audio_service.dto.response.CallRoomCreatedResponse;
import com.audio_service.dto.response.ConnectResponseDto;
import com.audio_service.entity.User;
import com.audio_service.enums.ConnectRequestStatus;
import com.audio_service.exception.InvalidCallStateException;
import com.audio_service.exception.RequestAlreadyPendingException;
import com.audio_service.exception.RequestNotFoundException;
import com.audio_service.exception.UserNotInQueueException;
import com.audio_service.redis.DistributedLockService;
import com.audio_service.redis.PendingConnectRequest;
import com.audio_service.redis.RedisMessagePublisher;
import com.audio_service.redis.RoomQueueRepository;
import com.audio_service.repository.UserRepository;
import com.audio_service.service.CallSessionService;
import com.audio_service.service.ConnectRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConnectRequestServiceImpl
        implements ConnectRequestService {

    private final UserRepository userRepository;

    private final RoomQueueRepository queueRepository;
    private final CallSessionService callSessionService;
    private final DistributedLockService lockService;
    private final RedisMessagePublisher publisher;

    private static final Duration REQUEST_TIMEOUT =
            Duration.ofSeconds(30);

    @Override
    public ConnectResponseDto sendRequest(
            String senderId,
            ConnectRequestDto request) {

        String receiverId =
                request.getTargetUserId();

        return lockService.execute(

                "connect:" + senderId + ":" + receiverId,

                5,

                30,

                () -> {

                    User sender =
                            userRepository.findByUserId(senderId)
                                    .orElseThrow();

                    User receiver =
                            userRepository.findByUserId(receiverId)
                                    .orElseThrow();

                    if (!queueRepository.isUserQueued(senderId)) {

                        throw new UserNotInQueueException(
                                "Sender is not present in queue");

                    }

                    if (!queueRepository.isUserQueued(receiverId)) {

                        throw new UserNotInQueueException(
                                "Receiver is not present in queue");

                    }

                    String requestId =
                            UUID.randomUUID().toString();

                    if (queueRepository.pendingExists(requestId)) {

                        throw new RequestAlreadyPendingException(
                                "Request already exists");

                    }

                    PendingConnectRequest pending =
                            PendingConnectRequest.builder()
                                    .requestId(requestId)
                                    .senderId(sender.getUserId())
                                    .receiverId(receiver.getUserId())
                                    .createdAt(System.currentTimeMillis())
                                    .build();

                    queueRepository.savePendingRequest(
                            requestId,
                            pending,
                            REQUEST_TIMEOUT);

                    publisher.publishQueueEvent(
                            pending);

                    ConnectResponseDto response =
                            new ConnectResponseDto();

                    response.setRequestId(requestId);


                    response.setStatus(
                            ConnectRequestStatus.PENDING);

                    response.setMessage(
                            "Connect request sent successfully");

                    return response;

                });

    }
    @Override
    public ConnectResponseDto cancelRequest(
            String senderId,
            String requestId) {

        PendingConnectRequest pending =
                (PendingConnectRequest)
                        queueRepository.getPendingRequest(requestId);

        if (pending == null) {

            throw new RequestNotFoundException(
                    "Pending request not found");

        }

        if (!pending.getSenderId().equals(senderId)) {

            throw new InvalidCallStateException(
                    "Only sender can cancel request");

        }

        queueRepository.removePendingRequest(requestId);

        publisher.publishQueueEvent(
                "REQUEST_CANCELLED:" + requestId);

        ConnectResponseDto response =
                new ConnectResponseDto();

        response.setRequestId(requestId);

        response.setStatus(
                ConnectRequestStatus.CANCELLED);

        response.setMessage(
                "Request cancelled successfully");

        return response;

    }
    @Override
    public CallRoomCreatedResponse acceptRequest(
            String receiverId,
            String requestId) {

        PendingConnectRequest pending =
                (PendingConnectRequest)
                        queueRepository.getPendingRequest(requestId);

        if (pending == null) {

            throw new RequestNotFoundException(
                    "Pending request expired");

        }

        if (!pending.getReceiverId().equals(receiverId)) {

            throw new InvalidCallStateException(
                    "Receiver mismatch");

        }

        queueRepository.removePendingRequest(requestId);

        queueRepository.removeUser(
                pending.getSenderId());

        queueRepository.removeUser(
                pending.getReceiverId());

        publisher.publishQueueEvent(
                "REQUEST_ACCEPTED:" + requestId);

        return callSessionService.createRoom(

                pending.getSenderId(),

                pending.getReceiverId()

        );

    }

    @Override
    public ConnectResponseDto rejectRequest(
            String receiverId,
            String requestId) {

        PendingConnectRequest pending =
                (PendingConnectRequest)
                        queueRepository.getPendingRequest(requestId);

        if (pending == null) {

            throw new RequestNotFoundException(
                    "Pending request not found");

        }

        if (!pending.getReceiverId().equals(receiverId)) {

            throw new InvalidCallStateException(
                    "Receiver mismatch");

        }

        queueRepository.removePendingRequest(requestId);

        publisher.publishQueueEvent(
                "REQUEST_REJECTED:" + requestId);

        ConnectResponseDto response =
                new ConnectResponseDto();

        response.setRequestId(requestId);

        response.setStatus(
                ConnectRequestStatus.REJECTED);

        response.setMessage(
                "Request rejected");

        return response;

    }

}