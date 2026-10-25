package com.zentalk.video.service.impl;

import com.zentalk.video.dto.response.*;
import com.zentalk.video.entity.User;
import com.zentalk.video.exception.VideoServiceException;
import com.zentalk.video.redis.RoomQueueRepository;
import com.zentalk.video.repository.UserRepository;
import com.zentalk.video.service.RoomQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class RoomQueueServiceImpl implements RoomQueueService {
    private final RoomQueueRepository queue;
    private final UserRepository userRepository;

    @Override
    public void enterQueue(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new VideoServiceException("User not found"));
        if (Boolean.FALSE.equals(user.getActive())) throw new VideoServiceException("User is inactive");
        if (queue.isUserQueued(userId)) return;
        queue.addUser(userId, Instant.now().toEpochMilli());
    }

    @Override
    public void exitQueue(String userId) {
        queue.removeUser(userId);
    }

    @Override
    public boolean isInQueue(String userId) {
        return queue.isUserQueued(userId);
    }

    @Override
    public RoomSnapshotResponse getQueueSnapshot() {
        var raw = queue.getUsers(100);
        var cards = new ArrayList<RoomCardDto>();
        for (Object item : raw) {
            String id = String.valueOf(item);
            userRepository.findByUserId(id).ifPresent(u ->
                cards.add(new RoomCardDto(
                    u.getUserId(), u.getName(), u.getProfilePhotoUrl(),
                    u.getCommunicationSeconds()
                )));
        }
        return new RoomSnapshotResponse(cards.size(), cards);
    }
}
