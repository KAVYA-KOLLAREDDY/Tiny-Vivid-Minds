package com.example.TVM.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "level_content")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LevelContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "content_id")
    private Integer contentId;

    @ManyToOne
    @JoinColumn(name = "level_id", nullable = false)
    private CourseLevel level;

    @Column(name = "content_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ContentType contentType;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String content; // For text content, or file path for media

    @Column(name = "content_order")
    private Integer contentOrder;

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = true;

    @Column(name = "estimated_minutes")
    private Integer estimatedMinutes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ContentType {
        TEXT, VIDEO, IMAGE, DOCUMENT, QUIZ
    }
}
