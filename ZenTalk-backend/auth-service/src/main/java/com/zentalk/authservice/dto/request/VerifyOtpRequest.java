package com.zentalk.authservice.dto.request;
import jakarta.validation.constraints.*;
public record VerifyOtpRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp="\\d{6}", message="OTP must be 6 digits") String otp
) {}
