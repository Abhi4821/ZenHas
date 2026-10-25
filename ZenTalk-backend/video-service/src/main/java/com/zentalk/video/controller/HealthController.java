package com.zentalk.video.controller;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/video")
public class HealthController {
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("success", true, "service", "video-service", "status", "UP");
    }
}
