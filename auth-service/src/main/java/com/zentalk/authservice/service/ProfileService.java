package com.zentalk.authservice.service;
import com.zentalk.authservice.dto.request.UpdateProfileRequest;
import com.zentalk.authservice.dto.response.ProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ProfileService {
    ProfileResponse get(String userId);
    ProfileResponse update(String userId, UpdateProfileRequest request);
    ProfileResponse updatePhoto(String userId, MultipartFile file);
}
