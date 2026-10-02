package com.zentalk.video.service;

import com.zentalk.video.dto.request.ConnectRequestDto;
import com.zentalk.video.dto.response.ConnectResponseDto;
import com.zentalk.video.dto.response.VideoSessionCreatedResponse;

public interface ConnectRequestService {
    ConnectResponseDto sendRequest(String senderId, ConnectRequestDto request);
    ConnectResponseDto cancelRequest(String senderId, String requestId);
    VideoSessionCreatedResponse acceptRequest(String receiverId, String requestId);
    ConnectResponseDto rejectRequest(String receiverId, String requestId);
}
