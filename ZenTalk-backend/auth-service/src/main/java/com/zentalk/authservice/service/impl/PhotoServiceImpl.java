package com.zentalk.authservice.service.impl;

import com.zentalk.authservice.exception.BadRequestException;
import com.zentalk.authservice.service.PhotoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.UUID;

@Service
public class PhotoServiceImpl implements PhotoService {
    private final Path root;

    public PhotoServiceImpl(@Value("${app.photo.storage-path}") String path) {
        try {
            this.root = Paths.get(path).toAbsolutePath().normalize();
            Files.createDirectories(root);
        } catch (Exception ex) { throw new IllegalStateException("Cannot initialize photo storage", ex); }
    }

    @Override
    public String store(String userId, MultipartFile file) {
        try {
            String contentType = file.getContentType();
            String ext = "image/png".equals(contentType) ? ".png" :
                    "image/webp".equals(contentType) ? ".webp" : ".jpg";
            String name = userId + "_" + UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), root.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            return "/profile-photos/" + name;
        } catch (Exception ex) { throw new BadRequestException("Unable to store profile photo"); }
    }

    @Override
    public void delete(String url) {
        try {
            String name = url.substring(url.lastIndexOf('/') + 1);
            Files.deleteIfExists(root.resolve(name));
        } catch (Exception ignored) {}
    }
}
