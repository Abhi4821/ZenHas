package com.zenhas;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SummrizeController {

    private final SummrizeService summrizeService;

    public SummrizeController(SummrizeService summrizeService) {
        this.summrizeService = summrizeService;
    }

    @PostMapping("/summarize")
    public String summarize(@RequestBody String ticket) {

        System.out.println("========== SUMMARIZE START ==========");
        System.out.println("Ticket = " + ticket);
        System.out.println("=====================================");
        return summrizeService.summarize(ticket);
//        return "Received: " + ticket;
    }

    @GetMapping
    public String home() {
        return "API is working";
    }

    @PostMapping("/test")
    public String test() {
        System.out.println("TEST START");
        return "POST working";
    }
}