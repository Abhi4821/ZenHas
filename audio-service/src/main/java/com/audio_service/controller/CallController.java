package com.audio_service.controller;

import com.audio_service.dto.request.CallEndRequestDto;
import com.audio_service.dto.response.ApiResponse;
import com.audio_service.service.CallSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/call")
public class CallController {

    private final CallSessionService callSessionService;

    @PostMapping("/end")
    public ApiResponse<Void> endCall(

            Authentication authentication,

            @RequestBody
            CallEndRequestDto request){

        callSessionService.endCall(

                authentication.getName(),

                request

        );

        return ApiResponse.successMessage(

                "Call ended successfully"

        );

    }

}