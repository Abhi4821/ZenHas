package com.zentalk.authservice.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="cities", uniqueConstraints=@UniqueConstraint(columnNames={"state_id","name"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class City {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, length=150) private String name;
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="state_id", nullable=false) private State state;
}
