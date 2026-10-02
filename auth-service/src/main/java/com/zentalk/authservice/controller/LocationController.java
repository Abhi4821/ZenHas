package com.zentalk.authservice.controller;

import com.zentalk.authservice.dto.response.*;
import com.zentalk.authservice.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
public class LocationController {
    private final LocationService locationService;

    @GetMapping("/countries")
    public ResponseEntity<ApiResponse<List<LocationItem>>> countries() {
        return ResponseEntity.ok(ApiResponse.ok("Countries fetched", locationService.countries()));
    }
    @GetMapping("/countries/{countryId}/states")
    public ResponseEntity<ApiResponse<List<LocationItem>>> states(@PathVariable Long countryId) {
        return ResponseEntity.ok(ApiResponse.ok("States fetched", locationService.states(countryId)));
    }
    @GetMapping("/states/{stateId}/cities")
    public ResponseEntity<ApiResponse<List<LocationItem>>> cities(@PathVariable Long stateId) {
        return ResponseEntity.ok(ApiResponse.ok("Cities fetched", locationService.cities(stateId)));
    }
}
