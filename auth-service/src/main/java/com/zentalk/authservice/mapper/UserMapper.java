package com.zentalk.authservice.mapper;

import com.zentalk.authservice.dto.response.*;
import com.zentalk.authservice.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public ProfileResponse toProfile(User u) {
        long s = u.getCommunicationSeconds();
        String time = "%d Hours %d Minutes %d Seconds".formatted(s / 3600, (s % 3600) / 60, s % 60);
        return new ProfileResponse(
                u.getUserId(), u.getName(), u.getEmail(), u.getGender(), u.getProfilePhotoUrl(),
                new LocationItem(u.getCountry().getId(), u.getCountry().getName()),
                new LocationItem(u.getState().getId(), u.getState().getName()),
                new LocationItem(u.getCity().getId(), u.getCity().getName()),
                s, time, u.getProfileCompletion(), u.getCreatedAt(), u.getLastLoginAt()
        );
    }
}
