package com.example.TVM.controller;

import com.example.TVM.dto.*;
import com.example.TVM.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponseDTO> login(
            @RequestBody AuthenticationRequestDTO request,
            HttpServletRequest servReq,
            HttpServletResponse response) {

        return ResponseEntity.ok(new AuthenticationResponseDTO(HttpStatus.OK,
                authService.login(servReq.getHeader("User-Agent"), request, response)));
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestParam String role, @RequestBody RegistrationRequestDTO request) {
        com.example.TVM.entity.User.UserRole userRole;
        try {
            userRole = com.example.TVM.entity.User.UserRole.valueOf(role.toLowerCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        authService.register(request, userRole);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/teacher")
    public ResponseEntity<Void> registerTeacher(@RequestBody TeacherRegistrationDTO request) {
        authService.registerTeacher(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/student")
    public ResponseEntity<Void> registerStudent(@RequestBody StudentRegistrationDTO request) {
        authService.registerStudent(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh-access-token")
    public ResponseEntity<AuthenticationResponseDTO> refreshAccessToken(
            HttpServletRequest request,
            HttpServletResponse response) {

        String accessToken = authService.generateNewTokenViaRefresh(request, response);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthenticationResponseDTO(HttpStatus.OK, accessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }
}

