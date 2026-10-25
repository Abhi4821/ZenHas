package com.zentalk.authservice.service.impl;
import com.zentalk.authservice.dto.response.LocationItem;
import com.zentalk.authservice.repository.*;
import com.zentalk.authservice.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationServiceImpl implements LocationService {
    private final CountryRepository countryRepository;
    private final StateRepository stateRepository;
    private final CityRepository cityRepository;

    @Override @Transactional(readOnly=true)
    public List<LocationItem> countries() {
        return countryRepository.findAllByOrderByNameAsc().stream().map(x -> new LocationItem(x.getId(), x.getName())).toList();
    }
    @Override @Transactional(readOnly=true)
    public List<LocationItem> states(Long countryId) {
        return stateRepository.findByCountryIdOrderByNameAsc(countryId).stream().map(x -> new LocationItem(x.getId(), x.getName())).toList();
    }
    @Override @Transactional(readOnly=true)
    public List<LocationItem> cities(Long stateId) {
        return cityRepository.findByStateIdOrderByNameAsc(stateId).stream().map(x -> new LocationItem(x.getId(), x.getName())).toList();
    }
}
