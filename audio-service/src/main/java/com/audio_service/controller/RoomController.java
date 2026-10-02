package com.audio_service.controller;

import com.audio_service.dto.request.ConnectRequestDto;
import com.audio_service.dto.response.ApiResponse;
import com.audio_service.dto.response.CallRoomCreatedResponse;
import com.audio_service.dto.response.ConnectResponseDto;
import com.audio_service.dto.response.RoomSnapshotResponse;
import com.audio_service.service.ConnectRequestService;
import com.audio_service.service.RoomQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomController {
    private final RoomQueueService roomQueueService;
    private final ConnectRequestService connectRequestService;
    @PostMapping("/enter")
    public ApiResponse<Void> enterQueue(
            Authentication authentication){

        roomQueueService.enterQueue(authentication.getName());

        return ApiResponse.successMessage(
                "Entered queue");

    }

    @PostMapping("/exit")
    public ApiResponse<Void> exitQueue(
            Authentication authentication){

        roomQueueService.exitQueue(authentication.getName());

        return ApiResponse.successMessage(
                 "Exited queue");

    }

    @GetMapping("/snapshot")
    public ApiResponse<RoomSnapshotResponse> snapshot(){

        return ApiResponse.success(

                roomQueueService.getQueueSnapshot()

        );

    }

    @PostMapping("/connect")
    public ApiResponse<ConnectResponseDto> connect(

            Authentication authentication,

            @RequestBody
            ConnectRequestDto request){

        return ApiResponse.success(

                connectRequestService.sendRequest(

                        authentication.getName(),

                        request

                )

        );

    }

    @PostMapping("/accept/{requestId}")
    public ApiResponse<CallRoomCreatedResponse> accept(

            Authentication authentication,

            @PathVariable String requestId){

        return ApiResponse.success(

                connectRequestService.acceptRequest(

                        authentication.getName(),

                        requestId

                )

        );

    }

    @PostMapping("/reject/{requestId}")
    public ApiResponse<ConnectResponseDto> reject(

            Authentication authentication,

            @PathVariable String requestId){

        return ApiResponse.success(

                connectRequestService.rejectRequest(

                        authentication.getName(),

                        requestId

                )

        );

    }

    @PostMapping("/cancel/{requestId}")
    public ApiResponse<ConnectResponseDto> cancel(

            Authentication authentication,

            @PathVariable String requestId){

        return ApiResponse.success(

                connectRequestService.cancelRequest(

                        authentication.getName(),

                        requestId

                )

        );

    }

}