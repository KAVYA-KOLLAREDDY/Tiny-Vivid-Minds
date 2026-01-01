package com.example.TVM.service;

import com.example.TVM.entity.JoinUs;
import com.example.TVM.repository.JoinUsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class JoinUsService {
    
    @Autowired
    private JoinUsRepository joinUsRepository;
    
    public List<JoinUs> getAllApplications() {
        return joinUsRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<JoinUs> getApplicationsByStatus(JoinUs.ApplicationStatus status) {
        return joinUsRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public List<JoinUs> getApplicationsBySubject(String subject) {
        return joinUsRepository.findByPreferredSubjectOrderByCreatedAtDesc(subject);
    }
    
    public JoinUs saveApplication(JoinUs joinUs) {
        return joinUsRepository.save(joinUs);
    }
    
    public Optional<JoinUs> getApplicationById(Long id) {
        return joinUsRepository.findById(id);
    }
    
    public JoinUs updateApplication(JoinUs joinUs) {
        return joinUsRepository.save(joinUs);
    }
    
    public void deleteApplication(Long id) {
        joinUsRepository.deleteById(id);
    }
    
    public JoinUs updateApplicationStatus(Long id, JoinUs.ApplicationStatus status) {
        Optional<JoinUs> applicationOpt = joinUsRepository.findById(id);
        if (applicationOpt.isPresent()) {
            JoinUs application = applicationOpt.get();
            application.setStatus(status);
            return joinUsRepository.save(application);
        }
        return null;
    }
}
