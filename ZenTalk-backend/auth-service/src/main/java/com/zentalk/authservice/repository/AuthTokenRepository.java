package com.zentalk.authservice.repository;
import com.zentalk.authservice.entity.AuthToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByTokenId(String tokenId);

    @Modifying
    @Query("update AuthToken t set t.revoked=true, t.revokedAt=:now where t.user.id=:userPk and t.revoked=false")
    int revokeAllByUserPk(@Param("userPk") Long userPk, @Param("now") Instant now);
}
