package com.audio_service.exception;

public class RequestAlreadyPendingException extends RuntimeException {

    public RequestAlreadyPendingException(String message) {
        super(message);
    }

}