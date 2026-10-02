package com.zentalk.video.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter @NoArgsConstructor
public class User {
    @Id
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, length = 40)
    private String userId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(name = "communication_seconds")
    private Long communicationSeconds;

    @Column(name = "active")
    private Boolean active;
}
