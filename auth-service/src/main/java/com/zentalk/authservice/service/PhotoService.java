package com.zentalk.authservice.service;
import org.springframework.web.multipart.MultipartFile;
public interface PhotoService {
    String store(String userId, MultipartFile file);
    void delete(String url);
}
