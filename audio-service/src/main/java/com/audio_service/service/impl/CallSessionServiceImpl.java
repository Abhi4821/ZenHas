package com.audio_service.service.impl;

import com.audio_service.dto.request.CallEndRequestDto;
import com.audio_service.dto.response.CallRoomCreatedResponse;
import com.audio_service.entity.CallLog;
import com.audio_service.entity.User;
import com.audio_service.enums.CallStatus;
import com.audio_service.exception.InvalidCallStateException;
import com.audio_service.redis.CallCreatedEvent;
import com.audio_service.redis.CallEndedEvent;
import com.audio_service.redis.RedisMessagePublisher;
import com.audio_service.repository.CallLogRepository;
import com.audio_service.repository.UserRepository;
import com.audio_service.service.CallSessionService;
import com.audio_service.util.RoomIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class CallSessionServiceImpl implements CallSessionService {

    private final CallLogRepository callLogRepository;

    private final UserRepository userRepository;

    private final RedisMessagePublisher publisher;

    @Override
    public CallRoomCreatedResponse createRoom(
            String callerId,
            String receiverId) {
//
//        User caller = userRepository.findById(callerId)
//                .orElseThrow(() ->
//                        new IllegalArgumentException("Caller not found"));
//
//        User receiver = userRepository.findById(receiverId)
//                .orElseThrow(() ->
//                        new IllegalArgumentException("Receiver not found"));




        User caller = userRepository.findByUserId(callerId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Caller not found"));

        User receiver = userRepository.findByUserId(receiverId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Receiver not found"));
        String roomId = RoomIdGenerator.generate();

        CallLog callLog = CallLog.builder()
                .roomId(roomId)
                .caller(caller)
                .receiver(receiver)
                .status(CallStatus.ACTIVE)
                .startedAt(LocalDateTime.now())
                .durationSeconds(0L)
                .build();

        callLogRepository.save(callLog);

        publisher.publishCallEvent(new CallCreatedEvent(
                roomId,
                callerId,
                receiverId
        ));

        CallRoomCreatedResponse response =
                new CallRoomCreatedResponse();

        response.setRoomId(roomId);

        response.setWebsocketEndpoint("/ws/audio");

        response.setSignalingTopic(
                "/topic/call/" + roomId);

        return response;

    }
    @Override
    @Transactional
    public void endCall(
            String userId,
            CallEndRequestDto request) {

        CallLog callLog =
                callLogRepository
                        .findByRoomId(request.getRoomId())
                        .orElseThrow(() ->
                                new InvalidCallStateException(
                                        "Call not found"));

        if (callLog.getStatus() != CallStatus.ACTIVE) {

            throw new InvalidCallStateException(
                    "Call already ended");

        }

        User caller = callLog.getCaller();

        User receiver = callLog.getReceiver();

        if (!caller.getUserId().equals(userId)
                &&
                !receiver.getUserId().equals(userId)) {

            throw new InvalidCallStateException(
                    "User is not part of this call");

        }

        LocalDateTime endTime =
                LocalDateTime.now();

        long duration = java.time.Duration.between(
                callLog.getStartedAt(),
                endTime
        ).getSeconds();

        if (duration < 0) {
            duration = 0;
        }

        callLog.setEndedAt(endTime);

        callLog.setDurationSeconds(duration);

        callLog.setStatus(CallStatus.ENDED);

        callLog.setEndReason(request.getReason());

        callLogRepository.save(callLog);

        updateCommunicationSeconds(
                caller,
                duration);

        updateCommunicationSeconds(
                receiver,
                duration);

        publisher.publishCallEvent(

                new CallEndedEvent(

                        callLog.getRoomId(),

                        caller.getUserId(),

                        receiver.getUserId(),

                        duration,

                        request.getReason()

                )

        );

    }
    private void updateCommunicationSeconds(

            User user,

            long durationSeconds){

        Long current =
                user.getCommunicationSeconds();

        if(current==null){

            current=0L;

        }

        user.setCommunicationSeconds(

                current+durationSeconds

        );

        userRepository.save(user);

    }

}