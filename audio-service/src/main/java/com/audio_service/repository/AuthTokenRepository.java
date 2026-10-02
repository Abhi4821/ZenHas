package com.audio_service.repository;
import com.audio_service.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AuthTokenRepository extends JpaRepository<AuthToken,Long> {
    Optional<AuthToken> findByTokenHashAndRevokedFalse(String tokenHash);
}