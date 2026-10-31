package com.rifasonline;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RifasApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(RifasApiApplication.class, args);
    }
}
