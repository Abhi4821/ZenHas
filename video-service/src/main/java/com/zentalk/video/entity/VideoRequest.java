package com.zentalk.video.entity;

import com.zentalk.video.enums.ConnectRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "video_requests",
       indexes = {
           @Index(name = "idx_video_requests_sender", columnList = "sender_user_id"),
           @Index(name = "idx_video_requests_receiver", columnList = "receiver_user_id"),
           @Index(name = "idx_video_requests_status", columnList = "status"),
           @Index(name = "idx_video_requests_expires_at", columnList = "expires_at")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VideoRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, unique = true, length = 64)
    private String requestId;

    @Column(name = "sender_user_id", nullable = false, length = 40)
    private String senderUserId;

    @Column(name = "receiver_user_id", nullable = false, length = 40)
    private String receiverUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConnectRequestStatus status;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(nullable = false)
    private Instant expiresAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
