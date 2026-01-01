package com.example.TVM.service;

import com.example.TVM.dto.ClassScheduleDTO;
import com.example.TVM.entity.ClassSchedule;
import com.example.TVM.entity.StudentTeacherAssignment;
import com.example.TVM.entity.CourseLevel;
import com.example.TVM.repository.ClassScheduleRepository;
import com.example.TVM.repository.StudentTeacherAssignmentRepository;
import com.example.TVM.repository.CourseLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassScheduleService {
    private final ClassScheduleRepository scheduleRepository;
    private final StudentTeacherAssignmentRepository assignmentRepository;
    private final CourseLevelRepository levelRepository;

    @Transactional
    public ClassScheduleDTO createSchedule(ClassScheduleDTO dto) {
        StudentTeacherAssignment assignment = assignmentRepository.findById(dto.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        ClassSchedule schedule = new ClassSchedule();
        schedule.setAssignment(assignment);
        schedule.setScheduledDate(dto.getScheduledDate());
        schedule.setDurationMinutes(dto.getDurationMinutes() != null ? dto.getDurationMinutes() : 60);
        schedule.setTopic(dto.getTopic());

        if (dto.getLevelId() != null) {
            CourseLevel level = levelRepository.findById(dto.getLevelId())
                    .orElseThrow(() -> new RuntimeException("Level not found"));
            schedule.setLevel(level);
        }

        schedule.setStatus(ClassSchedule.ClassStatus.scheduled);
        schedule = scheduleRepository.save(schedule);
        return mapToDTO(schedule);
    }

    public List<ClassScheduleDTO> getSchedulesByAssignment(Integer assignmentId) {
        return scheduleRepository.findByAssignmentAssignmentId(assignmentId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassScheduleDTO updateScheduleStatus(Integer classId, ClassSchedule.ClassStatus status) {
        ClassSchedule schedule = scheduleRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus(status);
        schedule = scheduleRepository.save(schedule);
        return mapToDTO(schedule);
    }

    @Transactional
    public void deleteSchedule(Integer classId) {
        scheduleRepository.deleteById(classId);
    }

    private ClassScheduleDTO mapToDTO(ClassSchedule schedule) {
        ClassScheduleDTO dto = new ClassScheduleDTO();
        dto.setClassId(schedule.getClassId());
        dto.setAssignmentId(schedule.getAssignment().getAssignmentId());
        dto.setScheduledDate(schedule.getScheduledDate());
        dto.setDurationMinutes(schedule.getDurationMinutes());
        dto.setTopic(schedule.getTopic());
        dto.setLevelId(schedule.getLevel() != null ? schedule.getLevel().getLevelId() : null);
        dto.setStatus(schedule.getStatus().name());
        return dto;
    }
}

