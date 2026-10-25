package com.zentalk.authservice.controller;

import com.zentalk.authservice.dto.request.*;
import com.zentalk.authservice.dto.response.*;
import com.zentalk.authservice.enums.OtpPurpose;
import com.zentalk.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/check-email")
    public ResponseEntity<ApiResponse<EmailCheckResponse>> check(@Valid @RequestBody EmailRequest r) {
        return ResponseEntity.ok(ApiResponse.ok("Email checked", authService.checkEmail(r.email())));
    }



    @PostMapping("/register/send-otp")
    public ResponseEntity<?> registrationOtp(@Valid @RequestBody EmailRequest r) {
        try {
            authService.sendOtp(r.email(), OtpPurpose.REGISTRATION, false);
            return ResponseEntity.ok(ApiResponse.ok("Registration OTP sent"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(e.getMessage());
        }
    }
    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyRegistration(@Valid @RequestBody VerifyOtpRequest r) {
        authService.verifyRegistrationOtp(r);
        return ResponseEntity.ok(ApiResponse.ok("Email verified"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resend(@RequestParam OtpPurpose purpose,
                                                    @Valid @RequestBody EmailRequest r) {
        authService.sendOtp(r.email(), purpose, true);
        return ResponseEntity.ok(ApiResponse.ok("OTP resent"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest r) {
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", authService.register(r)));
    }

    @PostMapping("/login/send-otp")
    public ResponseEntity<ApiResponse<Void>> loginOtp(@Valid @RequestBody EmailRequest r) {
        authService.sendOtp(r.email(), OtpPurpose.LOGIN, false);
        return ResponseEntity.ok(ApiResponse.ok("Login OTP sent"));
    }

    @PostMapping("/login/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody VerifyOtpRequest r) {
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authService.login(r)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader("Authorization") String authorization,
                                                    Authentication authentication) {
        authService.logout(authorization, authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Logout successful"));
    }
}
