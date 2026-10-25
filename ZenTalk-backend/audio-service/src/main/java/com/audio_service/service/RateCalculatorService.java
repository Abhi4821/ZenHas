package com.audio_service.service;

import com.audio_service.entity.User;

public interface RateCalculatorService {

    double calculatePriority(User user);

}