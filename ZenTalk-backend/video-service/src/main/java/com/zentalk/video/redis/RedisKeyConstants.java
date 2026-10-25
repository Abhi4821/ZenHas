package com.zentalk.video.redis;

public final class RedisKeyConstants {
    private RedisKeyConstants() {}

    public static final String QUEUE = "video:queue";
    public static final String PENDING = "video:pending:";
    public static final String OUTGOING = "video:outgoing:";
    public static final String INCOMING = "video:incoming:";
    public static final String SESSION = "video:session:";
    public static final String USER_STATUS = "video:user:status:";
}
