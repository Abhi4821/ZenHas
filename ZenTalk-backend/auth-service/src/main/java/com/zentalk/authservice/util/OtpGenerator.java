package com.zentalk.authservice.util;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;

@Component
public class OtpGenerator {
    private final SecureRandom random = new SecureRandom();
    public String generate() { return "%06d".formatted(random.nextInt(1_000_000)); }
}
