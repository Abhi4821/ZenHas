package com.audio_service.exception;

import com.audio_service.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserAlreadyInQueueException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyInQueue(
            UserAlreadyInQueueException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));

    }

    @ExceptionHandler(UserNotInQueueException.class)
    public ResponseEntity<ApiResponse<?>> handleNotInQueue(
            UserNotInQueueException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));

    }

    @ExceptionHandler(RequestAlreadyPendingException.class)
    public ResponseEntity<ApiResponse<?>> handlePending(
            RequestAlreadyPendingException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));

    }

    @ExceptionHandler(RequestNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleRequestNotFound(
            RequestNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));

    }

    @ExceptionHandler(InvalidCallStateException.class)
    public ResponseEntity<ApiResponse<?>> handleCallState(
            InvalidCallStateException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));

    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(
            Exception ex) {

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ex.getMessage()));

    }

}