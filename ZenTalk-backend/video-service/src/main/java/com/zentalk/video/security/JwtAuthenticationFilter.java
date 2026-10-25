package com.zentalk.video.security;

import com.zentalk.video.entity.AuthToken;
import com.zentalk.video.repository.AuthTokenRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthTokenRepository authTokenRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtTokenProvider.validateToken(token)) {
                Claims claims = jwtTokenProvider.parse(token);
                AuthToken authToken = authTokenRepository
                        .findByTokenHashAndRevokedFalse(TokenHashUtil.hash(token))
                        .orElse(null);

                if (authToken != null) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            claims.getSubject(), null, AuthorityUtils.NO_AUTHORITIES);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
