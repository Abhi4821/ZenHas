package com.zentalk.authservice.service.impl;

import com.zentalk.authservice.dto.request.*;
import com.zentalk.authservice.dto.response.*;
import com.zentalk.authservice.entity.*;
import com.zentalk.authservice.enums.OtpPurpose;
import com.zentalk.authservice.exception.*;
import com.zentalk.authservice.mapper.UserMapper;
import com.zentalk.authservice.repository.*;
import com.zentalk.authservice.security.JwtTokenProvider;
import com.zentalk.authservice.service.*;
import com.zentalk.authservice.util.*;
import com.zentalk.authservice.validation.LocationValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final OtpService otpService;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenHashUtil tokenHashUtil;
    private final UserIdGenerator userIdGenerator;
    private final ProfileCompletionUtil completionUtil;
    private final LocationValidator locationValidator;
    private final UserMapper userMapper;

    @Override
    public EmailCheckResponse checkEmail(String email) {
        boolean exists = userRepository.existsByEmailIgnoreCase(email.trim());
        return new EmailCheckResponse(exists, exists);
    }

    @Override
    public void sendOtp(String rawEmail, OtpPurpose purpose, boolean resend) {
        String email = rawEmail.trim().toLowerCase();
        boolean exists = userRepository.existsByEmailIgnoreCase(email);
        if (purpose == OtpPurpose.REGISTRATION && exists)
            throw new BadRequestException("Email already registered. Please login.");
        if (purpose == OtpPurpose.LOGIN && !exists)
            throw new UserNotFoundException("Account not found. Please register.");
        otpService.send(email, purpose, resend);
    }

    @Override
    public void verifyRegistrationOtp(VerifyOtpRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email()))
            throw new BadRequestException("Email already registered. Please login.");
        otpService.verify(request.email(), request.otp(), OtpPurpose.REGISTRATION);
    }

    @Override @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email))
            throw new BadRequestException("Email already registered. Please login.");

        otpService.requireVerified(email, OtpPurpose.REGISTRATION);
        var loc = locationValidator.validate(request.countryId(), request.stateId(), request.cityId());

        User user = User.builder()
                .userId(userIdGenerator.generate(request.name()))
                .name(request.name().trim()).email(email).emailVerified(true)
                .gender(request.gender()).country(loc.country()).state(loc.state()).city(loc.city())
                .communicationSeconds(0).profileCompletion(0).lastLoginAt(Instant.now()).build();
        user.setProfileCompletion(completionUtil.calculate(user));
        userRepository.save(user);
        otpService.consumeVerified(email, OtpPurpose.REGISTRATION);
        return createSession(user);
    }

    @Override @Transactional
    public AuthResponse login(VerifyOtpRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UserNotFoundException("Account not found"));
        otpService.verify(email, request.otp(), OtpPurpose.LOGIN);
        otpService.consumeVerified(email, OtpPurpose.LOGIN);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        return createSession(user);
    }

    @Override @Transactional
    public void logout(String bearerToken, String userId) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer "))
            throw new UnauthorizedException("Bearer token required");
        String raw = bearerToken.substring(7);
        var claims = jwtTokenProvider.parse(raw);
        if (!claims.getSubject().equals(userId)) throw new UnauthorizedException("Invalid token owner");
        AuthToken token = tokenRepository.findByTokenId(claims.getId())
                .orElseThrow(() -> new UnauthorizedException("Token not found"));
        token.setRevoked(true);
        token.setRevokedAt(Instant.now());
        tokenRepository.save(token);
    }

    private AuthResponse createSession(User user) {
        var generated = jwtTokenProvider.generate(user.getUserId(), user.getEmail());
        tokenRepository.save(AuthToken.builder()
                .user(user).tokenId(generated.jti()).tokenHash(tokenHashUtil.sha256(generated.token()))
                .issuedAt(generated.issuedAt()).expiresAt(generated.expiresAt()).revoked(false).build());
        return new AuthResponse(generated.token(), "Bearer", generated.expiresInSeconds(), userMapper.toProfile(user));
    }
}
