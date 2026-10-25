package com.zentalk.authservice.service.impl;

import com.zentalk.authservice.dto.request.UpdateProfileRequest;
import com.zentalk.authservice.dto.response.ProfileResponse;
import com.zentalk.authservice.entity.User;
import com.zentalk.authservice.exception.UserNotFoundException;
import com.zentalk.authservice.mapper.UserMapper;
import com.zentalk.authservice.repository.UserRepository;
import com.zentalk.authservice.service.*;
import com.zentalk.authservice.util.ProfileCompletionUtil;
import com.zentalk.authservice.validation.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final LocationValidator locationValidator;
    private final ProfileCompletionUtil completionUtil;
    private final PhotoValidator photoValidator;
    private final PhotoService photoService;

    @Override @Transactional(readOnly = true)
    public ProfileResponse get(String userId) { return userMapper.toProfile(user(userId)); }

    @Override @Transactional
    public ProfileResponse update(String userId, UpdateProfileRequest r) {
        User u = user(userId);
        var loc = locationValidator.validate(r.countryId(), r.stateId(), r.cityId());
        u.setName(r.name().trim());
        u.setGender(r.gender());
        u.setCountry(loc.country()); u.setState(loc.state()); u.setCity(loc.city());
        u.setProfileCompletion(completionUtil.calculate(u));
        return userMapper.toProfile(userRepository.save(u));
    }

    @Override @Transactional
    public ProfileResponse updatePhoto(String userId, MultipartFile file) {
        photoValidator.validate(file);
        User u = user(userId);
        String old = u.getProfilePhotoUrl();
        String url = photoService.store(userId, file);
        u.setProfilePhotoUrl(url);
        u.setProfileCompletion(completionUtil.calculate(u));
        userRepository.save(u);
        if (old != null) photoService.delete(old);
        return userMapper.toProfile(u);
    }

    private User user(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }
}
