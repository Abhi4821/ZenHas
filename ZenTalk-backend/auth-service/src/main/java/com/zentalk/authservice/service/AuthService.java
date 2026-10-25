package com.zentalk.authservice.service;
import com.zentalk.authservice.dto.request.*;
import com.zentalk.authservice.dto.response.*;
import com.zentalk.authservice.enums.OtpPurpose;

public interface AuthService {
    EmailCheckResponse checkEmail(String email);
    void sendOtp(String email, OtpPurpose purpose, boolean resend);
    void verifyRegistrationOtp(VerifyOtpRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse login(VerifyOtpRequest request);
    void logout(String bearerToken, String userId);
}
