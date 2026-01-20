package com.example.TVM.repository;

import com.example.TVM.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Integer> {
    List<Certificate> findByStudentUserId(Integer studentId);
    List<Certificate> findByStudentUserIdAndCourseCourseId(Integer studentId, Integer courseId);
    Optional<Certificate> findByVerificationCode(String verificationCode);
    boolean existsByStudentUserIdAndCourseCourseId(Integer studentId, Integer courseId);
}









