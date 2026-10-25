//package com.zentalk.authservice.controller;
//
//
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.util.Map;
//
//@RestController
//public class WelcomeController {
//
//
//    @GetMapping("/")
//    public String welcome() {
//        return "Welcome to ZenTalk Auth Service";
//    }
//
//}

package com.zentalk.authservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class WelcomeController {

    @GetMapping("/")
    public String welcome() {
        return "Welcome to ZenTalk Auth Service";
    }

    @GetMapping("/health")
    public String health() {
        return "Service is running";
    }
}