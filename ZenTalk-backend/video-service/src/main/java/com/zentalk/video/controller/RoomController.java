package com.zentalk.video.controller;

import com.zentalk.video.dto.request.ConnectRequestDto;
import com.zentalk.video.dto.response.*;
import com.zentalk.video.service.ConnectRequestService;
import com.zentalk.video.service.RoomQueueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/video/rooms")
public class RoomController {
    private final RoomQueueService roomQueueService;
    private final ConnectRequestService connectRequestService;

    @PostMapping("/enter")
    public ApiResponse<Void> enter(Authentication authentication) {
        roomQueueService.enterQueue(authentication.getName());
        return ApiResponse.successMessage("Entered video waiting room");
    }

    @PostMapping("/exit")
    public ApiResponse<Void> exit(Authentication authentication) {
        roomQueueService.exitQueue(authentication.getName());
        return ApiResponse.successMessage("Exited video waiting room");
    }

    @GetMapping("/snapshot")
    public ApiResponse<RoomSnapshotResponse> snapshot() {
        return ApiResponse.success(roomQueueService.getQueueSnapshot());
    }

    @PostMapping("/connect")
    public ApiResponse<ConnectResponseDto> connect(
            Authentication authentication,
            @Valid @RequestBody ConnectRequestDto request) {
        return ApiResponse.success(
                connectRequestService.sendRequest(authentication.getName(), request));
    }

    @PostMapping("/accept/{requestId}")
    public ApiResponse<VideoSessionCreatedResponse> accept(
            Authentication authentication,
            @PathVariable String requestId) {
        return ApiResponse.success(
                connectRequestService.acceptRequest(authentication.getName(), requestId));
    }

    @PostMapping("/reject/{requestId}")
    public ApiResponse<ConnectResponseDto> reject(
            Authentication authentication,
            @PathVariable String requestId) {
        return ApiResponse.success(
                connectRequestService.rejectRequest(authentication.getName(), requestId));
    }

    @PostMapping("/cancel/{requestId}")
    public ApiResponse<ConnectResponseDto> cancel(
            Authentication authentication,
            @PathVariable String requestId) {
        return ApiResponse.success(
                connectRequestService.cancelRequest(authentication.getName(), requestId));
    }
}
