package com.audio_service.util;

import java.security.SecureRandom;

public final class RoomIdGenerator {

    private static final String CHARACTERS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    private static final SecureRandom RANDOM =
            new SecureRandom();

    private static final int ROOM_LENGTH = 20;

    private RoomIdGenerator() {
    }

    public static String generate() {

        StringBuilder builder = new StringBuilder(ROOM_LENGTH);

        for (int i = 0; i < ROOM_LENGTH; i++) {

            builder.append(
                    CHARACTERS.charAt(
                            RANDOM.nextInt(CHARACTERS.length())
                    )
            );

        }

        return builder.toString();

    }

}