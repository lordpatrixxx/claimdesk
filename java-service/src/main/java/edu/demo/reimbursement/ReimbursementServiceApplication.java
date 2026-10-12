package edu.demo.reimbursement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Java business service.
 * The web app (Lovable) calls this service from its server functions;
 * the browser never talks to it directly.
 */
@SpringBootApplication
public class ReimbursementServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ReimbursementServiceApplication.class, args);
    }
}
