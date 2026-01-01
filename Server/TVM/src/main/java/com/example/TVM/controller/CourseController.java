package com.example.TVM.controller;

import com.example.TVM.dto.CourseDTO;
import com.example.TVM.dto.CourseLevelDTO;
import com.example.TVM.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/courses")
@CrossOrigin(origins = "http://localhost:4200")
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        List<CourseDTO> courses = courseService.getAllCourses();
        return ResponseEntity.ok(courses);
    }

    @PostMapping
    public ResponseEntity<CourseDTO> createCourse(@RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO created = courseService.createCourse(courseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseDTO> getCourseById(@PathVariable Integer id) {
        try {
            CourseDTO course = courseService.getCourseById(id);
            return ResponseEntity.ok(course);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseDTO> updateCourse(@PathVariable Integer id, @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO updated = courseService.updateCourse(id, courseDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Integer id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Course Level Management
    @PostMapping("/{courseId}/levels")
    public ResponseEntity<CourseLevelDTO> createLevel(@PathVariable Integer courseId, @RequestBody CourseLevelDTO levelDTO) {
        try {
            CourseLevelDTO created = courseService.createLevel(courseId, levelDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{courseId}/levels")
    public ResponseEntity<List<CourseLevelDTO>> getLevelsByCourse(@PathVariable Integer courseId) {
        List<CourseLevelDTO> levels = courseService.getLevelsByCourse(courseId);
        return ResponseEntity.ok(levels);
    }

    @PutMapping("/levels/{levelId}")
    public ResponseEntity<CourseLevelDTO> updateLevel(@PathVariable Integer levelId, @RequestBody CourseLevelDTO levelDTO) {
        try {
            CourseLevelDTO updated = courseService.updateLevel(levelId, levelDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/levels/{levelId}")
    public ResponseEntity<Void> deleteLevel(@PathVariable Integer levelId) {
        try {
            courseService.deleteLevel(levelId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

