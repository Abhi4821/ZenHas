package com.zentalk.authservice.controller;

import com.zentalk.authservice.dto.request.VerifyOtpRequest;
import com.zentalk.authservice.dto.response.ApiResponse;
import com.zentalk.authservice.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accountService;

    @PostMapping("/delete/send-otp")
    public ResponseEntity<ApiResponse<Void>> send(Authentication a,
                                                  @RequestParam(defaultValue="false") boolean resend) {
        accountService.sendDeleteOtp(a.getName(), resend);
        return ResponseEntity.ok(ApiResponse.ok("Delete-account OTP sent"));
    }

    @PostMapping("/delete/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verify(Authentication a,
                                                    @Valid @RequestBody VerifyOtpRequest r) {
        accountService.verifyDeleteOtp(a.getName(), r.otp());
        return ResponseEntity.ok(ApiResponse.ok("Delete-account OTP verified"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> delete(Authentication a,
                                                    @RequestParam boolean confirm) {
        if (!confirm) throw new com.zentalk.authservice.exception.BadRequestException("Final confirmation required");
        accountService.delete(a.getName());
        return ResponseEntity.ok(ApiResponse.ok("Account permanently deleted"));
    }
}
