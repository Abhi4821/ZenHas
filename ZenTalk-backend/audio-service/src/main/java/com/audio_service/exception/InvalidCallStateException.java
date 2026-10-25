package com.audio_service.exception;

public class InvalidCallStateException extends RuntimeException {

    public InvalidCallStateException(String message) {
        super(message);
    }

}