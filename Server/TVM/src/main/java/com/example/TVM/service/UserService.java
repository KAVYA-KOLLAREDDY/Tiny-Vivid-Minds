package com.example.TVM.service;

import com.example.TVM.dto.UserDTO;
import com.example.TVM.entity.User;
import com.example.TVM.entity.TeacherProfile;
import com.example.TVM.repository.UserRepository;
import com.example.TVM.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByRole(User.UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getUsersByStatus(User.UserStatus status) {
        return userRepository.findByStatus(status).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    @Transactional
    public UserDTO updateUserStatus(Integer userId, User.UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        user = userRepository.save(user);
        return mapToDTO(user);
    }

    @Transactional
    public void deleteUser(Integer userId) {
        userRepository.deleteById(userId);
    }

    private UserDTO mapToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setUserId(user.getUserId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setStatus(user.getStatus().name());
        dto.setCreatedAt(user.getCreatedAt());

        // Set phone number based on user role
        String phone = null;
        if (user.getRole() == User.UserRole.student && user.getStudentProfile() != null) {
            phone = user.getStudentProfile().getContactNumber();
            System.out.println("UserService: Mapped phone for student " + user.getUserId() + ": " + phone);
        } else if (user.getRole() == User.UserRole.teacher) {
            // Ensure TeacherProfile exists for teacher
            TeacherProfile teacherProfile = user.getTeacherProfile();
            if (teacherProfile == null) {
                // Create TeacherProfile if it doesn't exist
                teacherProfile = new TeacherProfile();
                teacherProfile.setUser(user);
                teacherProfile = teacherProfileRepository.save(teacherProfile);
                System.out.println("UserService: Created new TeacherProfile for teacher " + user.getUserId());
            }

            phone = teacherProfile.getContactNumber();
            if (phone == null || phone.trim().isEmpty()) {
                // Set a default phone number if not set
                phone = "Not Provided";
                System.out.println("UserService: Teacher " + user.getUserId() + " has no phone number set, using default");
            } else {
                System.out.println("UserService: Mapped phone for teacher " + user.getUserId() + ": " + phone);
            }
        } else if (user.getRole() == User.UserRole.admin) {
            // For admins, phone is not applicable
            phone = null;
            System.out.println("UserService: No phone available for admin " + user.getUserId());
        }
        dto.setPhone(phone);

        System.out.println("UserService: Mapped UserDTO for user " + user.getUserId() + " with phone: " + phone);
        return dto;
    }
}

