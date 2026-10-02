package com.zentalk.authservice.security;

import com.zentalk.authservice.repository.AuthTokenRepository;
import com.zentalk.authservice.util.TokenHashUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthTokenRepository authTokenRepository;
    private final TokenHashUtil tokenHashUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtTokenProvider.parse(token);
                var stored = authTokenRepository.findByTokenId(claims.getId());
                boolean valid = stored.isPresent()
                        && !stored.get().isRevoked()
                        && stored.get().getExpiresAt().isAfter(Instant.now())
                        && stored.get().getTokenHash().equals(tokenHashUtil.sha256(token));
                if (valid) {
                    var auth = new UsernamePasswordAuthenticationToken(claims.getSubject(), null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
