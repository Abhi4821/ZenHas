package com.audio_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AudioServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AudioServiceApplication.class, args);
    }
}