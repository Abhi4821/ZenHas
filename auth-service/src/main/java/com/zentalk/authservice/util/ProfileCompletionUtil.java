package com.zentalk.authservice.util;
import com.zentalk.authservice.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ProfileCompletionUtil {
    public int calculate(User u) {
        int completed = 0;
        if (u.getName() != null && !u.getName().isBlank()) completed++;
        if (u.getEmail() != null && u.isEmailVerified()) completed++;
        if (u.getGender() != null) completed++;
        if (u.getCountry() != null) completed++;
        if (u.getState() != null) completed++;
        if (u.getCity() != null) completed++;
        if (u.getProfilePhotoUrl() != null && !u.getProfilePhotoUrl().isBlank()) completed++;
        return Math.round(completed * 100f / 7f);
    }
}
