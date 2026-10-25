package com.audio_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;


    private SecretKey getKey() {

        System.out.println("SECRET = " + secret);

        return Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );

    }

    public Claims parse(String token) {

        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

    }

    public boolean validateToken(String token) {

        try {

            parse(token);

            System.out.println("JWT VALID");
            return true;

        } catch (JwtException | IllegalArgumentException ex) {

            System.out.println("JWT INVALID");
            ex.printStackTrace();
            return false;

        }

    }

    public String getUserId(String token) {

        return parse(token).getSubject();

    }

}