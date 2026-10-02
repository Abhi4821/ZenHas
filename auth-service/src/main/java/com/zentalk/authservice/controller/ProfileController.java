package com.zentalk.authservice.controller;

import com.zentalk.authservice.dto.request.UpdateProfileRequest;
import com.zentalk.authservice.dto.response.*;
import com.zentalk.authservice.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;
    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> get(Authentication a) {
        return ResponseEntity.ok(ApiResponse.ok("Profile fetched", profileService.get(a.getName())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> update(Authentication a,
                                                               @Valid @RequestBody UpdateProfileRequest r) {
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", profileService.update(a.getName(), r)));
    }

    @PostMapping(value="/photo", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProfileResponse>> photo(Authentication a,
                                                              @RequestPart("photo") MultipartFile photo) {
        return ResponseEntity.ok(ApiResponse.ok("Profile photo updated", profileService.updatePhoto(a.getName(), photo)));
    }
}
