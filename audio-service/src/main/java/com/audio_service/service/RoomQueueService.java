package com.audio_service.service;

import com.audio_service.dto.response.RoomSnapshotResponse;

public interface RoomQueueService {

    void enterQueue(String userId);

    void exitQueue(String userId);

    boolean isInQueue(String userId);

    RoomSnapshotResponse getQueueSnapshot();

}