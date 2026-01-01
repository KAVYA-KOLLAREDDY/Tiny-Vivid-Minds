package com.example.TVM.repository;

import com.example.TVM.entity.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Integer> {
    Optional<TeacherProfile> findByTeacherId(Integer teacherId);
}

