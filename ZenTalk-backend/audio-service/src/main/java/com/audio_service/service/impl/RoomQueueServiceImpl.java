package com.audio_service.service.impl;

import com.audio_service.dto.response.RoomCardDto;
import com.audio_service.dto.response.RoomSnapshotResponse;
import com.audio_service.entity.User;
import com.audio_service.enums.RateTier;
import com.audio_service.exception.UserAlreadyInQueueException;
import com.audio_service.exception.UserNotInQueueException;
import com.audio_service.redis.DistributedLockService;
import com.audio_service.redis.RedisMessagePublisher;
import com.audio_service.redis.RoomQueueRepository;
import com.audio_service.repository.UserRepository;
import com.audio_service.service.RateCalculatorService;
import com.audio_service.service.RoomQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomQueueServiceImpl implements RoomQueueService {

    private final UserRepository userRepository;

    private final RoomQueueRepository queueRepository;

    private final RateCalculatorService rateCalculatorService;

    private final DistributedLockService lockService;

    private final RedisMessagePublisher publisher;

    @Override
    public void enterQueue(String userId) {

        lockService.execute(
                "queue:" + userId,
                () -> {

                    if (queueRepository.isUserQueued(userId)) {

                        throw new UserAlreadyInQueueException(
                                "User already in queue");

                    }

                    User user = userRepository
                            .findByUserId(userId)
                            .orElseThrow();

                    /*
                     * First time migration:
                     * If rateTier is null, assign A and save it.
                     */
                    if (user.getRateTier() == null) {

                        user.setRateTier(RateTier.A);

                        userRepository.save(user);

                    }

                    double score =
                            rateCalculatorService
                                    .calculatePriority(user);

                    queueRepository.addUser(
                            userId,
                            score);

                    publisher.publishQueueEvent(
                            "QUEUE_JOIN:" + userId);

                });

    }

    @Override
    public void exitQueue(String userId) {

        lockService.execute(
                "queue:" + userId,
                () -> {

                    if (!queueRepository.isUserQueued(userId)) {

                        throw new UserNotInQueueException(
                                "User not in queue");

                    }

                    queueRepository.removeUser(userId);

                    publisher.publishQueueEvent(
                            "QUEUE_EXIT:" + userId);

                });

    }

    @Override
    public boolean isInQueue(String userId) {

        return queueRepository.isUserQueued(userId);

    }

    @Override
    public RoomSnapshotResponse getQueueSnapshot() {

//        return new RoomSnapshotResponse();

        RoomSnapshotResponse response = new RoomSnapshotResponse();

        Long total = queueRepository.queueSize();

        response.setTotalUsers(total == null ? 0 : total.intValue());

        List<RoomCardDto> cards = new ArrayList<>();

        if (total != null && total > 0) {

            Set<Object> queuedUsers = queueRepository.getTopUsers(total);

            System.out.println("QUEUE USERS = " + queuedUsers);

            for (Object obj : queuedUsers) {

                String userId = obj.toString();

                System.out.println("LOOKING USER = [" + userId + "]");
                User user = userRepository
                        .findByUserId(userId)
                        .orElse(null);

                if (user == null) {
                    System.out.println("Skipping missing user: " + userId);

                    queueRepository.removeUser(userId);

                    continue;
                }
                RoomCardDto dto = new RoomCardDto();

                dto.setUserId(user.getUserId());
                dto.setFullName(user.getName());
                dto.setProfilePhoto(user.getProfilePhotoUrl());

                dto.setCountry(
                        user.getCountry() != null
                                ? user.getCountry().getName()
                                : null
                );

                dto.setState(
                        user.getState() != null
                                ? user.getState().getName()
                                : null
                );

                dto.setRateTier(user.getRateTier());

                cards.add(dto);
            }
        }

        response.setUsers(cards);

        return response;
    }

}