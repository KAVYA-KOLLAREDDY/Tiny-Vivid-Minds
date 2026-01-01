package com.example.TVM.repository;

import com.example.TVM.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    
    List<Feedback> findByIsApprovedTrueOrderByCreatedAtDesc();
    
    @Query("SELECT f FROM Feedback f WHERE f.isApproved = true ORDER BY f.createdAt DESC")
    List<Feedback> findApprovedFeedbacks();
    
    List<Feedback> findByCourseOrderByCreatedAtDesc(String course);
}
