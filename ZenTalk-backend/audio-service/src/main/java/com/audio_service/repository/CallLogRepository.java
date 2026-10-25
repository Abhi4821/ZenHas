package com.audio_service.repository;

import com.audio_service.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CallLogRepository extends JpaRepository<CallLog,Long> {

    Optional<CallLog> findByRoomId(String roomId);

}