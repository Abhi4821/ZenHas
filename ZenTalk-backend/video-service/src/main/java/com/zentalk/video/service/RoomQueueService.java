package com.zentalk.video.service;

import com.zentalk.video.dto.response.RoomSnapshotResponse;

public interface RoomQueueService {
    void enterQueue(String userId);
    void exitQueue(String userId);
    boolean isInQueue(String userId);
    RoomSnapshotResponse getQueueSnapshot();
}
