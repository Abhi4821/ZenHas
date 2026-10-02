package com.zentalk.authservice.util;

import com.zentalk.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class UserIdGenerator {
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    public String generate(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        if (base.isBlank()) base = "user";
        if (base.length() > 20) base = base.substring(0, 20);

        for (int i = 0; i < 100; i++) {
            String value = base + "_" + (1000 + random.nextInt(9000));
            if (!userRepository.existsByUserId(value)) return value;
        }
        return base + "_" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }
}
