package edu.demo.reimbursement.api;

import edu.demo.reimbursement.api.ClaimDtos.ErrorResponse;
import edu.demo.reimbursement.domain.exception.ClaimValidationException;
import edu.demo.reimbursement.domain.exception.InvalidTransitionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

/** Turns custom exceptions into clear JSON errors. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ClaimValidationException.class)
    public ResponseEntity<ErrorResponse> validation(ClaimValidationException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ErrorResponse("VALIDATION_FAILED", e.getProblems()));
    }

    @ExceptionHandler(InvalidTransitionException.class)
    public ResponseEntity<ErrorResponse> transition(InvalidTransitionException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("INVALID_TRANSITION", List.of(e.getMessage())));
    }

    @ExceptionHandler({IllegalArgumentException.class, HttpMessageNotReadableException.class,
            MethodArgumentNotValidException.class})
    public ResponseEntity<ErrorResponse> badRequest(Exception e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("BAD_REQUEST", List.of("Malformed request: " + e.getClass().getSimpleName())));
    }
}
