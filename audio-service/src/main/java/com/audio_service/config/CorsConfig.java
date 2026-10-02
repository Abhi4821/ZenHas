package com.audio_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOriginPatterns(

                List.of("*")

        );

        configuration.setAllowedMethods(

                List.of(

                        "GET",

                        "POST",

                        "PUT",

                        "DELETE",

                        "OPTIONS"

                )

        );

        configuration.setAllowedHeaders(

                List.of("*")

        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(

                "/**",

                configuration

        );

        return source;

    }

}
