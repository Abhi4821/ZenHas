package com.audio_service.exception;

public class UserNotInQueueException extends RuntimeException {

    public UserNotInQueueException(String message) {
        super(message);
    }

}