package com.zentalk.authservice.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="states", uniqueConstraints=@UniqueConstraint(columnNames={"country_id","name"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class State {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false, length=150) private String name;
    @Column(name="state_code", length=20) private String stateCode;
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="country_id", nullable=false) private Country country;
}
