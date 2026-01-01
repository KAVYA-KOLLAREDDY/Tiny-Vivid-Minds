package com.example.TVM.repository;

import com.example.TVM.entity.LevelActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LevelActivityRepository extends JpaRepository<LevelActivity, Integer> {
    List<LevelActivity> findByLevelLevelId(Integer levelId);
    List<LevelActivity> findByLevelLevelIdAndIsRequiredTrue(Integer levelId);
}
