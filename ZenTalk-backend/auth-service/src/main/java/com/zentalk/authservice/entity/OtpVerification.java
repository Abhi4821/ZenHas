package com.zentalk.authservice.entity;

import com.zentalk.authservice.enums.OtpPurpose;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "otp_verifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpVerification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose;

    @Column(name = "otp_hash", nullable = false, length = 100)
    private String otpHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "last_sent_at", nullable = false)
    private Instant lastSentAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(nullable = false)
    private boolean consumed;
}
