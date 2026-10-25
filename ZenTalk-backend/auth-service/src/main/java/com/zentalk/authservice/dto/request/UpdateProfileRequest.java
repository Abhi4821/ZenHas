package com.zentalk.authservice.dto.request;
import com.zentalk.authservice.enums.Gender;
import jakarta.validation.constraints.*;

public record UpdateProfileRequest(
        @NotBlank @Size(max=100) String name,
        @NotNull Gender gender,
        @NotNull Long countryId,
        @NotNull Long stateId,
        @NotNull Long cityId
) {}
