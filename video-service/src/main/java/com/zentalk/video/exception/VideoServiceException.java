package com.zentalk.video.exception;

import org.springframework.http.HttpStatus;

public class VideoServiceException extends RuntimeException {
    private final HttpStatus status;
    public VideoServiceException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }
    public VideoServiceException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
    public HttpStatus getStatus() { return status; }
}
