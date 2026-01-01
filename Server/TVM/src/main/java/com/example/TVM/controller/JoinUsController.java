package com.example.TVM.controller;

import com.example.TVM.entity.JoinUs;
import com.example.TVM.service.JoinUsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/join-us")
@CrossOrigin(origins = "http://localhost:4200")
public class JoinUsController {
    
    @Autowired
    private JoinUsService joinUsService;
    
    @GetMapping
    public ResponseEntity<List<JoinUs>> getAllApplications() {
        List<JoinUs> applications = joinUsService.getAllApplications();
        return ResponseEntity.ok(applications);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<JoinUs>> getApplicationsByStatus(@PathVariable JoinUs.ApplicationStatus status) {
        List<JoinUs> applications = joinUsService.getApplicationsByStatus(status);
        return ResponseEntity.ok(applications);
    }
    
    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<JoinUs>> getApplicationsBySubject(@PathVariable String subject) {
        List<JoinUs> applications = joinUsService.getApplicationsBySubject(subject);
        return ResponseEntity.ok(applications);
    }
    
    @PostMapping
    public ResponseEntity<JoinUs> createApplication(@RequestBody JoinUs joinUs) {
        try {
            JoinUs savedApplication = joinUsService.saveApplication(joinUs);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedApplication);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<JoinUs> getApplicationById(@PathVariable Long id) {
        Optional<JoinUs> application = joinUsService.getApplicationById(id);
        return application.map(ResponseEntity::ok)
                         .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<JoinUs> updateApplication(@PathVariable Long id, @RequestBody JoinUs joinUs) {
        Optional<JoinUs> existingApplication = joinUsService.getApplicationById(id);
        if (existingApplication.isPresent()) {
            joinUs.setId(id);
            JoinUs updatedApplication = joinUsService.updateApplication(joinUs);
            return ResponseEntity.ok(updatedApplication);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<JoinUs> updateApplicationStatus(@PathVariable Long id, @RequestBody JoinUs.ApplicationStatus status) {
        JoinUs updatedApplication = joinUsService.updateApplicationStatus(id, status);
        if (updatedApplication != null) {
            return ResponseEntity.ok(updatedApplication);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        Optional<JoinUs> application = joinUsService.getApplicationById(id);
        if (application.isPresent()) {
            joinUsService.deleteApplication(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
