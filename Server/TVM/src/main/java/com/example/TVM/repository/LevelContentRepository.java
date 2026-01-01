package com.example.TVM.repository;

import com.example.TVM.entity.LevelContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LevelContentRepository extends JpaRepository<LevelContent, Integer> {
    List<LevelContent> findByLevelLevelIdOrderByContentOrderAsc(Integer levelId);
    List<LevelContent> findByLevelLevelIdAndIsRequiredTrue(Integer levelId);
}
