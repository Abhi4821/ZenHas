package com.zentalk.authservice.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.*;
import java.util.*;

@Component
public class JwtTokenProvider {
    private final SecretKey key;
    private final long expirationSeconds;

    public JwtTokenProvider(@Value("${app.jwt.secret}") String secret,
                            @Value("${app.jwt.expiration-seconds}") long expirationSeconds) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationSeconds = expirationSeconds;
    }

    public GeneratedToken generate(String userId, String email) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(expirationSeconds);
        String jti = UUID.randomUUID().toString();
        String token = Jwts.builder()
                .subject(userId)
                .claim("email", email)
                .id(jti)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
        return new GeneratedToken(token, jti, now, expiry, expirationSeconds);
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
    }

    public record GeneratedToken(String token, String jti, Instant issuedAt,
                                 Instant expiresAt, long expiresInSeconds) {}
}
