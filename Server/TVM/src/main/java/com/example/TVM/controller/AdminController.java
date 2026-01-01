package com.example.TVM.controller;

import com.example.TVM.dto.UserDTO;
import com.example.TVM.entity.User;
import com.example.TVM.entity.Feedback;
import com.example.TVM.entity.DemoBooking;
import com.example.TVM.entity.Contact;
import com.example.TVM.service.UserService;
import com.example.TVM.service.AssignmentService;
import com.example.TVM.service.FeedbackService;
import com.example.TVM.service.DemoBookingService;
import com.example.TVM.service.ContactService;
import com.example.TVM.dto.StudentAssignmentDTO;
import com.example.TVM.dto.TeacherCourseAssignmentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    private final UserService userService;
    private final AssignmentService assignmentService;
    private final FeedbackService feedbackService;
    private final DemoBookingService demoBookingService;
    private final ContactService contactService;

    // User Management
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        try {
            User.UserRole userRole = User.UserRole.valueOf(role.toLowerCase());
            List<UserDTO> users = userService.getUsersByRole(userRole);
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/users/status/{status}")
    public ResponseEntity<List<UserDTO>> getUsersByStatus(@PathVariable String status) {
        try {
            User.UserStatus userStatus = User.UserStatus.valueOf(status.toLowerCase());
            List<UserDTO> users = userService.getUsersByStatus(userStatus);
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Integer id) {
        try {
            UserDTO user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserDTO> updateUserStatus(@PathVariable Integer id, @RequestBody String status) {
        try {
            User.UserStatus userStatus = User.UserStatus.valueOf(status.toLowerCase());
            UserDTO user = userService.updateUserStatus(id, userStatus);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Assignment Management
    @GetMapping("/assignments/teacher-course")
    public ResponseEntity<List<TeacherCourseAssignmentDTO>> getAllTeacherCourseAssignments() {
        List<TeacherCourseAssignmentDTO> assignments = assignmentService.getAllTeacherCourseAssignments();
        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/assignments/student-teacher")
    public ResponseEntity<List<StudentAssignmentDTO>> getAllStudentTeacherAssignments() {
        List<StudentAssignmentDTO> assignments = assignmentService.getAllStudentTeacherAssignments();
        return ResponseEntity.ok(assignments);
    }

    @PostMapping("/assign/teacher-course")
    public ResponseEntity<StudentAssignmentDTO> assignTeacherToCourse(
            @RequestParam Integer teacherId,
            @RequestParam Integer courseId) {
        try {
            StudentAssignmentDTO result = assignmentService.assignTeacherToCourse(teacherId, courseId);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/assign/student-teacher")
    public ResponseEntity<StudentAssignmentDTO> assignStudentToTeacher(@RequestBody StudentAssignmentDTO dto) {
        try {
            StudentAssignmentDTO result = assignmentService.assignStudentToTeacher(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Feedback Management
    @GetMapping("/feedbacks")
    public ResponseEntity<List<Feedback>> getAllFeedbacks() {
        List<Feedback> feedbacks = feedbackService.getAllFeedbacks();
        return ResponseEntity.ok(feedbacks);
    }

    @PutMapping("/feedbacks/{id}/approve")
    public ResponseEntity<Feedback> approveFeedback(@PathVariable Long id) {
        Feedback approved = feedbackService.approveFeedback(id);
        if (approved != null) {
            return ResponseEntity.ok(approved);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/feedbacks/{id}/reject")
    public ResponseEntity<Void> rejectFeedback(@PathVariable Long id) {
        try {
            feedbackService.deleteFeedback(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Demo Booking Management
    @GetMapping("/demo-bookings")
    public ResponseEntity<List<DemoBooking>> getAllDemoBookings() {
        List<DemoBooking> bookings = demoBookingService.getAllDemoBookings();
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/demo-bookings/{id}/status")
    public ResponseEntity<DemoBooking> updateDemoBookingStatus(@PathVariable Long id, @RequestBody DemoBooking.BookingStatus status) {
        DemoBooking updated = demoBookingService.updateBookingStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // Contact Management
    @GetMapping("/contacts")
    public ResponseEntity<List<Contact>> getAllContacts() {
        List<Contact> contacts = contactService.getAllContacts();
        return ResponseEntity.ok(contacts);
    }

    @PutMapping("/contacts/{id}/status")
    public ResponseEntity<Contact> updateContactStatus(@PathVariable Long id, @RequestBody Contact.ContactStatus status) {
        Contact updated = contactService.updateContactStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // Note: Admin can also access teacher calendar since admin is also a teacher
    // Admin can use /api/teacher/calendar endpoint
}

