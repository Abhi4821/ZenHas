package com.zentalk.video.service;

import com.zentalk.video.dto.request.CallEndRequestDto;
import com.zentalk.video.dto.response.VideoSessionCreatedResponse;
import com.zentalk.video.dto.response.CallEventDto;
public interface VideoSessionService {
    VideoSessionCreatedResponse createSession(String userA, String userB);
    void endCall(String userId, CallEndRequestDto request);
    boolean isMember(String userId, String sessionId);
}
