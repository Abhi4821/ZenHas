package com.audio_service.dto.response;

import com.audio_service.enums.RateTier;
import lombok.Data;

@Data
public class RoomCardDto {

    private String userId;

    private String fullName;

    private String profilePhoto;

    private String country;

    private String state;

    private RateTier rateTier;

}