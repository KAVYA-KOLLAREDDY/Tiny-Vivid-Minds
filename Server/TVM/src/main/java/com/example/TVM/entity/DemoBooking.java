package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "demo_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemoBooking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "parent_name", nullable = false)
    private String parentName;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String phone;
    
    @Column(name = "child_name", nullable = false)
    private String childName;
    
    @Column(name = "child_age", nullable = false)
    private Integer childAge;
    
    @Column(name = "preferred_course", nullable = false)
    private String preferredCourse;
    
    @Column(name = "preferred_date", nullable = false)
    private String preferredDate;
    
    @Column(name = "preferred_time", nullable = false)
    private String preferredTime;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "VARCHAR(20) DEFAULT 'pending'")
    private BookingStatus status = BookingStatus.PENDING;
    
    public enum BookingStatus {
        PENDING, CONFIRMED, COMPLETED, CANCELLED
    }

    // Manual getter/setter for status
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
}
