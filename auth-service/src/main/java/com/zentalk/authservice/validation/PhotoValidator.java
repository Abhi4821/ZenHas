package com.zentalk.authservice.validation;

import com.zentalk.authservice.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import java.util.Set;

@Component
public class PhotoValidator {
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp");

    @Value("${app.photo.max-size-bytes}")
    private long maxSize;

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("Photo is empty");
        if (file.getSize() > maxSize) throw new BadRequestException("Photo exceeds maximum allowed size");
        if (!ALLOWED.contains(file.getContentType())) throw new BadRequestException("Only JPEG, PNG and WEBP are allowed");
    }
}
