package com.zentalk.authservice.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="countries")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Country {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, unique=true, length=100) private String name;
    @Column(name="iso2", nullable=false, unique=true, length=2) private String iso2;
}
