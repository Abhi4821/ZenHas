package com.audio_service.entity;

import com.audio_service.enums.CallEndReason;
import com.audio_service.enums.CallStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name="call_logs")
public class CallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false,unique=true,length=100)
    private String roomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="caller_id")
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="receiver_id")
    private User receiver;

    @Enumerated(EnumType.STRING)
    private CallStatus status;

    @Enumerated(EnumType.STRING)
    private CallEndReason endReason;

    private LocalDateTime startedAt;

    private LocalDateTime connectedAt;

    private LocalDateTime endedAt;

    private Long durationSeconds;

}