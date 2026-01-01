package com.example.TVM.repository;

import com.example.TVM.entity.JoinUs;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JoinUsRepository extends JpaRepository<JoinUs, Long> {
    
    List<JoinUs> findByStatusOrderByCreatedAtDesc(JoinUs.ApplicationStatus status);
    
    List<JoinUs> findAllByOrderByCreatedAtDesc();
    
    List<JoinUs> findByPreferredSubjectOrderByCreatedAtDesc(String subject);
}
