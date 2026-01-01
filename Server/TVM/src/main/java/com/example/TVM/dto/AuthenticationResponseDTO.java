package com.example.TVM.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@Data
@NoArgsConstructor
public class AuthenticationResponseDTO {
    private HttpStatus status;
    private String token;

    // Manual constructor for status and token
    public AuthenticationResponseDTO(HttpStatus status, String token) {
        this.status = status;
        this.token = token;
    }
}

