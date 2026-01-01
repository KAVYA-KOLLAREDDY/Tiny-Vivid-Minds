package com.example.TVM.service;

import com.example.TVM.dto.CourseDTO;
import com.example.TVM.dto.CourseLevelDTO;
import com.example.TVM.entity.Course;
import com.example.TVM.entity.CourseLevel;
import com.example.TVM.entity.User;
import com.example.TVM.repository.CourseLevelRepository;
import com.example.TVM.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final CourseLevelRepository courseLevelRepository;
    private final AuthService authService;

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseDTO createCourse(CourseDTO courseDTO) {
        User currentUser = authService.getUser();
        Course course = new Course();
        course.setCourseName(courseDTO.getCourseName());
        course.setDescription(courseDTO.getDescription());
        course.setCreatedBy(currentUser);
        course = courseRepository.save(course);
        return mapToDTO(course);
    }

    public CourseDTO getCourseById(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        return mapToDTO(course);
    }

    @Transactional
    public CourseDTO updateCourse(Integer courseId, CourseDTO courseDTO) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        course.setCourseName(courseDTO.getCourseName());
        course.setDescription(courseDTO.getDescription());
        course = courseRepository.save(course);
        return mapToDTO(course);
    }

    @Transactional
    public void deleteCourse(Integer courseId) {
        courseRepository.deleteById(courseId);
    }

    @Transactional
    public CourseLevelDTO createLevel(Integer courseId, CourseLevelDTO levelDTO) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        CourseLevel level = new CourseLevel();
        level.setCourse(course);
        level.setLevelNumber(levelDTO.getLevelNumber());
        level.setLevelName(levelDTO.getLevelName());
        level.setObjectives(levelDTO.getObjectives());
        level.setDurationWeeks(levelDTO.getDurationWeeks());
        level = courseLevelRepository.save(level);
        return mapLevelToDTO(level);
    }

    public List<CourseLevelDTO> getLevelsByCourse(Integer courseId) {
        return courseLevelRepository.findByCourseCourseIdOrderByLevelNumberAsc(courseId).stream()
                .map(this::mapLevelToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseLevelDTO updateLevel(Integer levelId, CourseLevelDTO levelDTO) {
        CourseLevel level = courseLevelRepository.findById(levelId)
                .orElseThrow(() -> new RuntimeException("Level not found"));
        level.setLevelNumber(levelDTO.getLevelNumber());
        level.setLevelName(levelDTO.getLevelName());
        level.setObjectives(levelDTO.getObjectives());
        level.setDurationWeeks(levelDTO.getDurationWeeks());
        level = courseLevelRepository.save(level);
        return mapLevelToDTO(level);
    }

    @Transactional
    public void deleteLevel(Integer levelId) {
        courseLevelRepository.deleteById(levelId);
    }

    private CourseDTO mapToDTO(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setCourseId(course.getCourseId());
        dto.setCourseName(course.getCourseName());
        dto.setDescription(course.getDescription());
        dto.setCreatedBy(course.getCreatedBy() != null ? course.getCreatedBy().getUserId() : null);
        dto.setCreatedAt(course.getCreatedAt());
        return dto;
    }

    private CourseLevelDTO mapLevelToDTO(CourseLevel level) {
        CourseLevelDTO dto = new CourseLevelDTO();
        dto.setLevelId(level.getLevelId());
        dto.setCourseId(level.getCourse().getCourseId());
        dto.setLevelNumber(level.getLevelNumber());
        dto.setLevelName(level.getLevelName());
        dto.setObjectives(level.getObjectives());
        dto.setDurationWeeks(level.getDurationWeeks());
        return dto;
    }
}

