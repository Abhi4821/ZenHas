package com.audio_service.security;

import com.audio_service.entity.AuthToken;
import com.audio_service.repository.AuthTokenRepository;
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
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println("========== JWT FILTER ==========");

        System.out.println("URI = " + request.getRequestURI());
        String header =
                request.getHeader("Authorization");


        System.out.println("HEADER = " + header);

        if(header!=null && header.startsWith("Bearer ")){

            String token =
                    header.substring(7);

            System.out.println("TOKEN = " + token.substring(0, 20));
            if (!jwtTokenProvider.validateToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }
            Claims claims =
                    jwtTokenProvider.parse(token);

            System.out.println("USER = " + claims.getSubject());
            String hash =
                    TokenHashUtil.hash(token);

            System.out.println("HASH = " + hash);
            AuthToken authToken =
                    authTokenRepository
                            .findByTokenHashAndRevokedFalse(hash)
                            .orElse(null);

            System.out.println("DB TOKEN = " + authToken);
            if(authToken!=null){

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                claims.getSubject(),
                                null,
                                AuthorityUtils.NO_AUTHORITIES
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
                System.out.println("AUTHENTICATED");

            }

        }

        filterChain.doFilter(request,response);

    }

}