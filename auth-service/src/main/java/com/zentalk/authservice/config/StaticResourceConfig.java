package com.zentalk.authservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Value("${app.photo.storage-path}") private String storagePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(storagePath).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/profile-photos/**").addResourceLocations(location);
    }
}
