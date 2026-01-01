package com.example.TVM.service;

import com.example.TVM.dto.AuthenticationRequestDTO;
import com.example.TVM.dto.RegistrationRequestDTO;
import com.example.TVM.dto.TeacherRegistrationDTO;
import com.example.TVM.dto.StudentRegistrationDTO;
import com.example.TVM.entity.RefreshToken;
import com.example.TVM.entity.TeacherProfile;
import com.example.TVM.entity.StudentProfile;
import com.example.TVM.entity.User;
import com.example.TVM.helpers.JwtHelpers;
import com.example.TVM.repository.RefreshTokenRepository;
import com.example.TVM.repository.TeacherProfileRepository;
import com.example.TVM.repository.StudentProfileRepository;
import com.example.TVM.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final TeacherProfileRepository teacherProfileRepository;
    private final StudentProfileRepository studentProfileRepository;

    public User getUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user;
    }

    private String generateRefreshToken(User user) {
        String refreshToken = Jwts.builder()
                .issuer("TVM")
                .subject(user.getEmail())
                .claim("username", user.getFullName())
                .claim("authorities", user.getAuthorities()
                        .stream().map(authority -> authority.getAuthority())
                        .collect(Collectors.joining(",")))
                .claim("nonce", UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + (7 * 24 * 60 * 60 * 1000))) // 7 Days
                .signWith(Keys.hmacShaKeyFor(JwtHelpers.ACCESS_REFRESH.getBytes()))
                .compact();

        return refreshToken;
    }

    private String generateAccessToken(User user) {
        String jwt = Jwts
                .builder()
                .issuer("TVM")
                .subject(user.getEmail())
                .claim("username", user.getFullName())
                .claim("authorities", user.getAuthorities()
                        .stream().map(authority -> authority.getAuthority())
                        .collect(Collectors.joining(",")))
                .claim("nonce", UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + (15 * 60 * 1000))) // 15 min
                .signWith(Keys.hmacShaKeyFor(JwtHelpers.ACCESS_SECRET.getBytes()))
                .compact();
        return jwt;
    }

    @Transactional
    public String login(String agent, AuthenticationRequestDTO request, HttpServletResponse response) {
        String jwt = "";
        String refreshToken = "";
        // 1. Create Authentication Object
        Authentication authentication = UsernamePasswordAuthenticationToken
                .unauthenticated(request.getEmail(), request.getPassword());

        // 2. Start the authentication process
        Authentication authResponse = authenticationManager.authenticate(authentication);

        if (authResponse != null && authResponse.isAuthenticated()) {
            User user = (User) authResponse.getPrincipal();
            jwt = this.generateAccessToken(user);
            refreshToken = this.generateRefreshToken(user);

            RefreshToken refreshJWT = RefreshToken
                    .builder()
                    .user(user)
                    .token(hashRefreshToken(refreshToken))
                    .createdAt(LocalDateTime.now())
                    .expiryDate(LocalDateTime.now().plusDays(7))
                    .userAgent(agent)
                    .revoked(false)
                    .build();

            refreshTokenRepository.save(refreshJWT);

            ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(Duration.ofDays(7))
                    .sameSite("Lax")
                    .build();

            response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }

        return jwt;
    }

    public String hashRefreshToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing refresh token", e);
        }
    }

    @Transactional
    public void register(RegistrationRequestDTO request, User.UserRole role) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email Already Exists!");
        }
        User user = new User();
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setEmail(request.getEmail());
        user.setStatus(User.UserStatus.pending);
        userRepository.save(user);
        log.info("User registered: {}", request.getEmail());
    }

    @Transactional
    public void registerTeacher(TeacherRegistrationDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email Already Exists!");
        }
        User user = new User();
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.UserRole.teacher);
        user.setEmail(request.getEmail());
        user.setStatus(User.UserStatus.pending);
        user = userRepository.save(user);

        TeacherProfile profile = new TeacherProfile();
        profile.setUser(user);
        profile.setQualification(request.getQualification());
        profile.setExperienceYears(request.getExperienceYears());
        profile.setSpecialization(request.getSpecialization());
        profile.setBio(request.getBio());
        teacherProfileRepository.save(profile);
        log.info("Teacher registered: {}", request.getEmail());
    }

    @Transactional
    public void registerStudent(StudentRegistrationDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email Already Exists!");
        }
        User user = new User();
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.UserRole.student);
        user.setEmail(request.getEmail());
        user.setStatus(User.UserStatus.pending);
        user = userRepository.save(user);

        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setAge(request.getAge());
        profile.setClassLevel(request.getClassLevel());
        profile.setParentName(request.getParentName());
        profile.setContactNumber(request.getContactNumber());
        studentProfileRepository.save(profile);
        log.info("Student registered: {}", request.getEmail());
    }

    public String generateNewTokenViaRefresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, "refresh_token");
        if (refreshToken == null || !JwtHelpers.isRefreshValid(refreshToken)) {
            throw new RuntimeException("Hey!! Refresh Token Expired!");
        }

        String hashedRefreshToken = hashRefreshToken(refreshToken);
        Optional<RefreshToken> dbToken = refreshTokenRepository.findByToken(hashedRefreshToken);

        if (dbToken.isEmpty()) {
            throw new RuntimeException("Refresh Token Not Found!");
        }

        RefreshToken refreshDBToken = dbToken.get();
        if (refreshDBToken.getRevoked()) {
            throw new RuntimeException("Refresh Token Revoked!");
        }

        Claims claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(JwtHelpers.ACCESS_REFRESH.getBytes()))
                .build()
                .parseSignedClaims(refreshToken)
                .getPayload();

        String username = String.valueOf(claims.get("sub"));
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Invalid email!"));

        refreshDBToken.setLastUsedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshDBToken);

        String accessToken = generateAccessToken(user);
        return accessToken;
    }

    private String getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, "refresh_token");
        if (refreshToken != null) {
            refreshTokenService.revokeToken(hashRefreshToken(refreshToken));
        }

        ResponseCookie deleteCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(false)
                .secure(false)
                .path("/api/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.setHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
    }
}

