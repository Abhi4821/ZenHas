package com.zentalk.authservice.repository;
import com.zentalk.authservice.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CityRepository extends JpaRepository<City, Long> {
    List<City> findByStateIdOrderByNameAsc(Long stateId);
}
