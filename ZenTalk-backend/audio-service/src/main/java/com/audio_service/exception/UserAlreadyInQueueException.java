package com.audio_service.exception;

public class UserAlreadyInQueueException extends RuntimeException {

    public UserAlreadyInQueueException(String message) {
        super(message);
    }

}