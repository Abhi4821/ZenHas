package com.zentalk.authservice.service;
import com.zentalk.authservice.dto.response.LocationItem;
import java.util.List;
public interface LocationService {
    List<LocationItem> countries();
    List<LocationItem> states(Long countryId);
    List<LocationItem> cities(Long stateId);
}
