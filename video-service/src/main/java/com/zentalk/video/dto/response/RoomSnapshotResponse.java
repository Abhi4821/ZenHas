package com.zentalk.video.dto.response;

import java.util.List;

public record RoomSnapshotResponse(
        int totalUsers,
        List<RoomCardDto> users) {}
