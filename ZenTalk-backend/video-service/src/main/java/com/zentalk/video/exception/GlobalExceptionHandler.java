package com.zentalk.video.exception;

import com.zentalk.video.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(VideoServiceException.class)
    public ResponseEntity<ApiResponse<Void>> handle(VideoServiceException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.failure(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        return ResponseEntity.internalServerError()
                .body(ApiResponse.failure("Internal server error"));
    }
}
