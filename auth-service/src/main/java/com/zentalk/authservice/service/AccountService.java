package com.zentalk.authservice.service;
public interface AccountService {
    void sendDeleteOtp(String userId, boolean resend);
    void verifyDeleteOtp(String userId, String otp);
    void delete(String userId);
}
