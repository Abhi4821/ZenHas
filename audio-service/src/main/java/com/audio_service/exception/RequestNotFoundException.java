package com.audio_service.exception;

public class RequestNotFoundException extends RuntimeException {

    public RequestNotFoundException(String message) {
        super(message);
    }

}