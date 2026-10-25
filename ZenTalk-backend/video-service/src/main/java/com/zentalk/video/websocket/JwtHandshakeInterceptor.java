package com.zentalk.video.websocket;

import com.zentalk.video.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.*;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        if (!(request instanceof ServletServerHttpRequest servlet)) return false;

        HttpServletRequest http = servlet.getServletRequest();
        String token = http.getParameter("token");
        if (token == null || token.isBlank()) return false;
        if (!jwtTokenProvider.validateToken(token)) return false;

        attributes.put("userId", jwtTokenProvider.getUserId(token));
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {}
}
