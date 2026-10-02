package com.zentalk.authservice.repository;
import com.zentalk.authservice.entity.State;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface StateRepository extends JpaRepository<State, Long> {
    List<State> findByCountryIdOrderByNameAsc(Long countryId);
}
