package com.audio_service.service.impl;

import com.audio_service.entity.User;
import com.audio_service.service.RateCalculatorService;
import org.springframework.stereotype.Service;

import static com.audio_service.enums.RateTier.*;

@Service
public class RateCalculatorServiceImpl
        implements RateCalculatorService {

    @Override
    public double calculatePriority(User user) {


        double score = switch (user.getRateTier()) {

            case A -> 1000;

            case B -> 900;

            case C -> 800;

            case D -> 700;

            case E -> 600;

        };

        score +=
                (user.getCommunicationSeconds() / 3600.0);

        return score;

    }

}