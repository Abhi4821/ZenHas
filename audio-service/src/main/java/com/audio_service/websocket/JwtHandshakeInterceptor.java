package com.audio_service.websocket;

import com.audio_service.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor
        implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes)
            throws Exception {

        System.out.println("========== WS HANDSHAKE ==========");
        System.out.println("URI = " + request.getURI());


        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            System.out.println("NOT SERVLET REQUEST");
            return false;
        }

        HttpServletRequest http =
                servletRequest.getServletRequest();

        String token =
                http.getParameter("token");

        System.out.println("TOKEN PRESENT = "
                + (token != null && !token.isBlank()));

        if (token == null || token.isBlank()) {

            return false;

        }

        if (!jwtTokenProvider.validateToken(token)) {
            System.out.println("WS REJECTED: INVALID TOKEN");
            return false;

        }

        String userId =
                jwtTokenProvider.getUserId(token);

        System.out.println("WS USER = " + userId);

        attributes.put("userId", userId);

        System.out.println("WS HANDSHAKE ACCEPTED");

        return true;

    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {

    }

}