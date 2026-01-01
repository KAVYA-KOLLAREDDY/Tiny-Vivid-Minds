package com.example.TVM.controller;

import com.example.TVM.entity.DemoBooking;
import com.example.TVM.service.DemoBookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/book-demo")
@CrossOrigin(origins = "http://localhost:4200")
public class DemoBookingController {
    
    @Autowired
    private DemoBookingService demoBookingService;
    
    @GetMapping
    public ResponseEntity<List<DemoBooking>> getAllDemoBookings() {
        List<DemoBooking> bookings = demoBookingService.getAllDemoBookings();
        return ResponseEntity.ok(bookings);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<DemoBooking>> getDemoBookingsByStatus(@PathVariable DemoBooking.BookingStatus status) {
        List<DemoBooking> bookings = demoBookingService.getDemoBookingsByStatus(status);
        return ResponseEntity.ok(bookings);
    }
    
    @GetMapping("/course/{course}")
    public ResponseEntity<List<DemoBooking>> getDemoBookingsByCourse(@PathVariable String course) {
        List<DemoBooking> bookings = demoBookingService.getDemoBookingsByCourse(course);
        return ResponseEntity.ok(bookings);
    }
    
    @PostMapping
    public ResponseEntity<DemoBooking> createDemoBooking(@RequestBody DemoBooking demoBooking) {
        try {
            DemoBooking savedBooking = demoBookingService.saveDemoBooking(demoBooking);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DemoBooking> getDemoBookingById(@PathVariable Long id) {
        Optional<DemoBooking> booking = demoBookingService.getDemoBookingById(id);
        return booking.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DemoBooking> updateDemoBooking(@PathVariable Long id, @RequestBody DemoBooking demoBooking) {
        Optional<DemoBooking> existingBooking = demoBookingService.getDemoBookingById(id);
        if (existingBooking.isPresent()) {
            demoBooking.setId(id);
            DemoBooking updatedBooking = demoBookingService.updateDemoBooking(demoBooking);
            return ResponseEntity.ok(updatedBooking);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<DemoBooking> updateBookingStatus(@PathVariable Long id, @RequestBody DemoBooking.BookingStatus status) {
        DemoBooking updatedBooking = demoBookingService.updateBookingStatus(id, status);
        if (updatedBooking != null) {
            return ResponseEntity.ok(updatedBooking);
        }
        return ResponseEntity.notFound().build();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDemoBooking(@PathVariable Long id) {
        Optional<DemoBooking> booking = demoBookingService.getDemoBookingById(id);
        if (booking.isPresent()) {
            demoBookingService.deleteDemoBooking(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
