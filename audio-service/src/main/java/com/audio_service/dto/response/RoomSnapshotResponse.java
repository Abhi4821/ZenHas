package com.audio_service.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class RoomSnapshotResponse {

    private Integer totalUsers;

    private List<RoomCardDto> users;

}