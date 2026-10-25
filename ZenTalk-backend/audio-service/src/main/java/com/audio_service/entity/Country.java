package com.audio_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

@Entity
@Table(name = "countries")
public class Country {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false,length=100)
    private String name;

//    @Column(nullable=false,length=10,unique=true)
//    private String isoCode;

    @Column(name = "iso2", nullable = false, unique = true, length = 2)
    private String iso2;

}