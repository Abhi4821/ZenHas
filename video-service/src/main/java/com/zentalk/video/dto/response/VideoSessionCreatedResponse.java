package com.zentalk.video.dto.response;

public record VideoSessionCreatedResponse(
        String sessionId,
        String websocketEndpoint,
        String offerTopic,
        String answerTopic,
        String iceTopic) {}
