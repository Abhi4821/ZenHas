package com.zentalk.authservice.validation;

import com.zentalk.authservice.entity.*;
import com.zentalk.authservice.exception.BadRequestException;
import com.zentalk.authservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LocationValidator {
    private final CountryRepository countryRepository;
    private final StateRepository stateRepository;
    private final CityRepository cityRepository;

    public LocationSelection validate(Long countryId, Long stateId, Long cityId) {
        Country country = countryRepository.findById(countryId)
                .orElseThrow(() -> new BadRequestException("Invalid country"));
        State state = stateRepository.findById(stateId)
                .orElseThrow(() -> new BadRequestException("Invalid state"));
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new BadRequestException("Invalid city"));

        if (!state.getCountry().getId().equals(country.getId()))
            throw new BadRequestException("State does not belong to selected country");
        if (!city.getState().getId().equals(state.getId()))
            throw new BadRequestException("City does not belong to selected state");

        return new LocationSelection(country, state, city);
    }

    public record LocationSelection(Country country, State state, City city) {}
}
