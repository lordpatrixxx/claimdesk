package edu.demo.reimbursement.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Server-to-server authentication.
 * Every /api/** request must carry the shared key in the X-Service-Key header.
 * The key comes from the SERVICE_API_KEY environment variable and is never
 * sent to the browser.
 */
@Component
public class ServiceKeyFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Service-Key";

    private final String expectedKey;

    public ServiceKeyFilter(@Value("${service.api-key:}") String expectedKey) {
        this.expectedKey = expectedKey;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // The health check is public so hosting platforms can probe it.
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (expectedKey == null || expectedKey.length() < 16) {
            reject(response, 503, "SERVICE_NOT_CONFIGURED", "SERVICE_API_KEY is missing or too short on the Java service");
            return;
        }
        String provided = request.getHeader(HEADER);
        if (provided == null || !constantTimeEquals(provided, expectedKey)) {
            reject(response, 401, "UNAUTHORIZED", "Missing or invalid service key");
            return;
        }
        chain.doFilter(request, response);
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static void reject(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + code + "\",\"messages\":[\"" + message + "\"]}");
    }
}
