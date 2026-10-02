package com.zentalk.video.service.impl;

import com.zentalk.video.dto.request.CallEndRequestDto;
import com.zentalk.video.dto.response.VideoSessionCreatedResponse;
import com.zentalk.video.entity.VideoSession;
import com.zentalk.video.enums.CallStatus;
import com.zentalk.video.exception.VideoServiceException;
import com.zentalk.video.repository.VideoSessionRepository;
import com.zentalk.video.service.VideoSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.zentalk.video.dto.response.CallEventDto;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoSessionServiceImpl implements VideoSessionService {
    private final VideoSessionRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public VideoSessionCreatedResponse createSession(String userA, String userB) {
        if (userA.equals(userB)) throw new VideoServiceException("Cannot create session with yourself");

        boolean busy = repository.existsByStatusAndUserAOrStatusAndUserB(
                CallStatus.CREATED, userA, CallStatus.CREATED, userA)
                || repository.existsByStatusAndUserAOrStatusAndUserB(
                CallStatus.ACTIVE, userA, CallStatus.ACTIVE, userA)
                || repository.existsByStatusAndUserAOrStatusAndUserB(
                CallStatus.CREATED, userB, CallStatus.CREATED, userB)
                || repository.existsByStatusAndUserAOrStatusAndUserB(
                CallStatus.ACTIVE, userB, CallStatus.ACTIVE, userB);

        if (busy) throw new VideoServiceException("One of the users is already in a video session", HttpStatus.CONFLICT);

        String sessionId = UUID.randomUUID().toString().replace("-", "");
        VideoSession session = VideoSession.builder()
                .sessionId(sessionId)
                .userA(userA)
                .userB(userB)
                .status(CallStatus.ACTIVE)
                .createdAt(Instant.now())
                .startedAt(Instant.now())
                .build();
        repository.save(session);

        CallEventDto event = new CallEventDto("CALL_STARTED", sessionId, userA, userB, null);
        messagingTemplate.convertAndSend("/topic/video/events", event);

        return new VideoSessionCreatedResponse(
                sessionId, "/ws/video",
                "/topic/video/call/" + sessionId + "/offer",
                "/topic/video/call/" + sessionId + "/answer",
                "/topic/video/call/" + sessionId + "/ice");
    }

    @Override
    @Transactional
    public void endCall(String userId, CallEndRequestDto request) {
        VideoSession session = repository.findBySessionId(request.sessionId())
                .orElseThrow(() -> new VideoServiceException("Video session not found", HttpStatus.NOT_FOUND));

        if (!isMember(userId, request.sessionId()))
            throw new VideoServiceException("You are not a member of this session", HttpStatus.FORBIDDEN);

        if (session.getStatus() == CallStatus.ENDED) return;

        session.setStatus(CallStatus.ENDED);
        session.setEndReason(request.reason());
        session.setEndedAt(Instant.now());
        repository.save(session);

        messagingTemplate.convertAndSend("/topic/video/events",
                new CallEventDto("CALL_ENDED", session.getSessionId(),
                        session.getUserA(), session.getUserB(), request.reason().name()));
    }

    @Override
    public boolean isMember(String userId, String sessionId) {
        return repository.findBySessionId(sessionId)
                .map(s -> userId.equals(s.getUserA()) || userId.equals(s.getUserB()))
                .orElse(false);
    }
}
