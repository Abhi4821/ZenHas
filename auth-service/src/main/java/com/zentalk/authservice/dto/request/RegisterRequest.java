package com.zentalk.authservice.dto.request;
import com.zentalk.authservice.enums.Gender;
import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(max=100) String name,
        @NotBlank @Email String email,
        @NotNull Gender gender,
        @NotNull Long countryId,
        @NotNull Long stateId,
        @NotNull Long cityId
) {}
