package com.zentalk.authservice.repository;
import com.zentalk.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUserId(String userId);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUserId(String userId);
}
