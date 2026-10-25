package com.zentalk.authservice.service.impl;

import com.zentalk.authservice.entity.OtpVerification;
import com.zentalk.authservice.enums.OtpPurpose;
import com.zentalk.authservice.exception.BadRequestException;
import com.zentalk.authservice.repository.OtpRepository;
import com.zentalk.authservice.service.OtpService;
import com.zentalk.authservice.util.OtpGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {
    private final OtpRepository otpRepository;
    private final OtpGenerator otpGenerator;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiry-seconds}") private long expirySeconds;
    @Value("${app.otp.resend-cooldown-seconds}") private long cooldownSeconds;
    @Value("${app.otp.max-failed-attempts}") private int maxAttempts;
    @Value("${spring.mail.username}") private String from;

    @Override @Transactional
    public void send(String rawEmail, OtpPurpose purpose, boolean resend) {
        String email = rawEmail.trim().toLowerCase();
        Instant now = Instant.now();
        otpRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, purpose)
                .ifPresent(last -> {
                    if (last.getLastSentAt().plusSeconds(cooldownSeconds).isAfter(now))
                        throw new BadRequestException("Please wait before requesting another OTP");
                });

        String otp = otpGenerator.generate();
        OtpVerification entity = OtpVerification.builder()
                .email(email).purpose(purpose).otpHash(passwordEncoder.encode(otp))
                .createdAt(now).lastSentAt(now).expiresAt(now.plusSeconds(expirySeconds))
                .failedAttempts(0).consumed(false).build();
        otpRepository.save(entity);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("ZenTalk verification OTP");
        message.setText("Your ZenTalk OTP is " + otp + ". It expires in " + (expirySeconds / 60) +
                " minutes. Do not share this OTP.");
        mailSender.send(message);
    }

    @Override @Transactional
    public void verify(String rawEmail, String otp, OtpPurpose purpose) {
        String email = rawEmail.trim().toLowerCase();
        OtpVerification row = latest(email, purpose);
        if (row.isConsumed()) throw new BadRequestException("OTP already used");
        if (row.getExpiresAt().isBefore(Instant.now())) throw new BadRequestException("OTP expired");
        if (row.getFailedAttempts() >= maxAttempts) throw new BadRequestException("Maximum OTP attempts exceeded");

        if (!passwordEncoder.matches(otp, row.getOtpHash())) {
            row.setFailedAttempts(row.getFailedAttempts() + 1);
            otpRepository.save(row);
            throw new BadRequestException("Invalid OTP");
        }
        row.setVerifiedAt(Instant.now());
        otpRepository.save(row);
    }

    @Override
    public void requireVerified(String email, OtpPurpose purpose) {
        OtpVerification row = latest(email.trim().toLowerCase(), purpose);
        if (row.isConsumed() || row.getVerifiedAt() == null || row.getExpiresAt().isBefore(Instant.now()))
            throw new BadRequestException("Email OTP verification required");
    }

    @Override @Transactional
    public void consumeVerified(String email, OtpPurpose purpose) {
        OtpVerification row = latest(email.trim().toLowerCase(), purpose);
        if (row.getVerifiedAt() == null || row.isConsumed()) throw new BadRequestException("OTP not verified");
        row.setConsumed(true);
        otpRepository.save(row);
    }

    private OtpVerification latest(String email, OtpPurpose purpose) {
        return otpRepository.findTopByEmailIgnoreCaseAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new BadRequestException("OTP request not found"));
    }
}
