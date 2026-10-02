package com.audio_service.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;

    private String message;

    private T data;

    public static <T> ApiResponse<T> success(T data){

        return ApiResponse.<T>builder()
                .success(true)
                .message("Success")
                .data(data)
                .build();

    }

    public static <T> ApiResponse<T> error(String message){

        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();

    }

    public static ApiResponse<Void> successMessage(String message){

        return ApiResponse.<Void>builder()
                .success(true)
                .message(message)
                .data(null)
                .build();

    }

}
