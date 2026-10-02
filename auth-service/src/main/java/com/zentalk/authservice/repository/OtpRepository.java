package com.zentalk.authservice.repository;
import com.zentalk.authservice.entity.OtpVerification;
import com.zentalk.authservice.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(String email, OtpPurpose purpose);
    void deleteByEmailIgnoreCase(String email);
}
