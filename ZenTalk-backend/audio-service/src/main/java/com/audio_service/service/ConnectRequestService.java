package com.audio_service.service;

import com.audio_service.dto.request.ConnectRequestDto;
import com.audio_service.dto.response.CallRoomCreatedResponse;
import com.audio_service.dto.response.ConnectResponseDto;

public interface ConnectRequestService {
    ConnectResponseDto sendRequest(
            String senderId,
            ConnectRequestDto request);

    ConnectResponseDto cancelRequest(
            String senderId,
            String requestId);

    CallRoomCreatedResponse acceptRequest(
            String receiverId,
            String requestId);

    ConnectResponseDto rejectRequest(
            String receiverId,
            String requestId);
}