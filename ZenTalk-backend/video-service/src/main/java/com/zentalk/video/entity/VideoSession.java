package com.zentalk.video.entity;

import com.zentalk.video.enums.CallEndReason;
import com.zentalk.video.enums.CallStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "video_sessions",
       indexes = {
           @Index(name = "idx_video_sessions_user_a", columnList = "user_a"),
           @Index(name = "idx_video_sessions_user_b", columnList = "user_b"),
           @Index(name = "idx_video_sessions_status", columnList = "status")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VideoSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true, length = 64)
    private String sessionId;

    @Column(name = "user_a", nullable = false, length = 40)
    private String userA;

    @Column(name = "user_b", nullable = false, length = 40)
    private String userB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CallStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "end_reason", length = 50)
    private CallEndReason endReason;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant startedAt;
    private Instant endedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
