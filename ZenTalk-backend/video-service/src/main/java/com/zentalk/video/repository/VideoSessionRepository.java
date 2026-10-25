package com.zentalk.video.repository;

import com.zentalk.video.entity.VideoSession;
import com.zentalk.video.enums.CallStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VideoSessionRepository extends JpaRepository<VideoSession, Long> {
    Optional<VideoSession> findBySessionId(String sessionId);

    boolean existsByStatusAndUserAOrStatusAndUserB(
            CallStatus statusA, String userA,
            CallStatus statusB, String userB);
}
