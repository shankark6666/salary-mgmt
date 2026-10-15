package com.acme.salary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Launcher. Sits in the root package so component scanning picks up every module. */
@SpringBootApplication
public class SalaryApplication {

    public static void main(String[] args) {
        SpringApplication.run(SalaryApplication.class, args);
    }
}
