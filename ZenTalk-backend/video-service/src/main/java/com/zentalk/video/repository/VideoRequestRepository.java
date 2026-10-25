package com.zentalk.video.repository;

import com.zentalk.video.entity.VideoRequest;
import com.zentalk.video.enums.ConnectRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface VideoRequestRepository extends JpaRepository<VideoRequest, Long> {
    Optional<VideoRequest> findByRequestId(String requestId);
    List<VideoRequest> findByReceiverUserIdAndStatus(String receiverUserId, ConnectRequestStatus status);
    List<VideoRequest> findBySenderUserIdAndStatus(String senderUserId, ConnectRequestStatus status);
    List<VideoRequest> findByStatusAndExpiresAtBefore(ConnectRequestStatus status, Instant instant);
}
