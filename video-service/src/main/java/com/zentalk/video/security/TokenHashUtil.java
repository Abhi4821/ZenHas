package com.zentalk.video.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class TokenHashUtil {
    private TokenHashUtil() {}

    public static String hash(String token) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
