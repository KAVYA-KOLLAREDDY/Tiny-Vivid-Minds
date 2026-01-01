package com.example.TVM.service;

import com.example.TVM.entity.Feedback;
import com.example.TVM.repository.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FeedbackService {
    
    @Autowired
    private FeedbackRepository feedbackRepository;
    
    public List<Feedback> getAllFeedbacks() {
        return feedbackRepository.findAll();
    }
    
    public List<Feedback> getApprovedFeedbacks() {
        return feedbackRepository.findApprovedFeedbacks();
    }
    
    public List<Feedback> getFeedbacksByCourse(String course) {
        return feedbackRepository.findByCourseOrderByCreatedAtDesc(course);
    }
    
    public Feedback saveFeedback(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }
    
    public Optional<Feedback> getFeedbackById(Long id) {
        return feedbackRepository.findById(id);
    }
    
    public Feedback updateFeedback(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }
    
    public void deleteFeedback(Long id) {
        feedbackRepository.deleteById(id);
    }
    
    public Feedback approveFeedback(Long id) {
        Optional<Feedback> feedbackOpt = feedbackRepository.findById(id);
        if (feedbackOpt.isPresent()) {
            Feedback feedback = feedbackOpt.get();
            feedback.setIsApproved(true);
            return feedbackRepository.save(feedback);
        }
        return null;
    }
}
