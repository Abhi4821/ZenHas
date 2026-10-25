package com.zentalk.video.controller;

import com.zentalk.video.dto.request.CallEndRequestDto;
import com.zentalk.video.dto.response.ApiResponse;
import com.zentalk.video.service.VideoSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/video/call")
public class CallController {
    private final VideoSessionService sessionService;

    @PostMapping("/end")
    public ApiResponse<Void> end(
            Authentication authentication,
            @Valid @RequestBody CallEndRequestDto request) {
        sessionService.endCall(authentication.getName(), request);
        return ApiResponse.successMessage("Call ended successfully");
    }
}
