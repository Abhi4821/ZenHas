//
//
//package com.audio_service.entity;
//
//import jakarta.persistence.*;
//import lombok.*;
//
//import java.time.Instant;
//
//@Entity
//@Table(name = "auth_tokens")
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class AuthToken {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @JoinColumn(name = "user_pk", nullable = false)
//    private User user;
//
//    @Column(name = "token_id", nullable = false, unique = true, length = 100)
//    private String tokenId;
//
//    @Column(name = "token_hash", nullable = false, length = 64)
//    private String tokenHash;
//
//    @Column(name = "issued_at", nullable = false)
//    private Instant issuedAt;
//
//    @Column(name = "expires_at", nullable = false)
//    private Instant expiresAt;
//
//    @Column(nullable = false)
//    private boolean revoked;
//
//    @Column(name = "revoked_at")
//    private Instant revokedAt;
//}

package com.audio_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "auth_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthToken {

    @Id
    private Long id;

    @Column(name = "token_hash")
    private String tokenHash;

    @Column(name = "token_id")
    private String tokenId;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "revoked")
    private Boolean revoked;

}