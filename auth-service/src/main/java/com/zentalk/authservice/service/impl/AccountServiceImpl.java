package com.zentalk.authservice.service.impl;

import com.zentalk.authservice.entity.User;
import com.zentalk.authservice.enums.OtpPurpose;
import com.zentalk.authservice.exception.UserNotFoundException;
import com.zentalk.authservice.repository.*;
import com.zentalk.authservice.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {
    private final UserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final OtpRepository otpRepository;
    private final OtpService otpService;
    private final PhotoService photoService;

    @Override
    public void sendDeleteOtp(String userId, boolean resend) {
        otpService.send(user(userId).getEmail(), OtpPurpose.DELETE_ACCOUNT, resend);
    }

    @Override
    public void verifyDeleteOtp(String userId, String otp) {
        otpService.verify(user(userId).getEmail(), otp, OtpPurpose.DELETE_ACCOUNT);
    }

    @Override @Transactional
    public void delete(String userId) {
        User u = user(userId);
        otpService.requireVerified(u.getEmail(), OtpPurpose.DELETE_ACCOUNT);
        tokenRepository.revokeAllByUserPk(u.getId(), Instant.now());
        otpRepository.deleteByEmailIgnoreCase(u.getEmail());
        String photo = u.getProfilePhotoUrl();
        userRepository.delete(u);
        if (photo != null) photoService.delete(photo);
    }

    private User user(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
}
