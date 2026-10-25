package com.audio_service.service;

import com.audio_service.dto.request.CallEndRequestDto;
import com.audio_service.dto.response.CallRoomCreatedResponse;

public interface CallSessionService {

    CallRoomCreatedResponse createRoom(
            String callerId,
            String receiverId);

    void endCall(
            String userId,
            CallEndRequestDto request);

}