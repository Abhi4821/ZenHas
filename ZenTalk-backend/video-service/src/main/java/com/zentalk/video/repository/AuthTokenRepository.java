package com.zentalk.video.repository;

import com.zentalk.video.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByTokenHashAndRevokedFalse(String tokenHash);
}
