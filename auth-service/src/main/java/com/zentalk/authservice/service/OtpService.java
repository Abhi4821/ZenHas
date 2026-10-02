package com.zentalk.authservice.service;
import com.zentalk.authservice.enums.OtpPurpose;
public interface OtpService {
    void send(String email, OtpPurpose purpose, boolean resend);
    void verify(String email, String otp, OtpPurpose purpose);
    void requireVerified(String email, OtpPurpose purpose);
    void consumeVerified(String email, OtpPurpose purpose);
}
