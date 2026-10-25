package com.audio_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name="states")
public class State {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false,length=150)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name="country_id")
    private Country country;

}