package com.example.TVM.service;

import com.example.TVM.entity.DemoBooking;
import com.example.TVM.repository.DemoBookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DemoBookingService {
    
    @Autowired
    private DemoBookingRepository demoBookingRepository;
    
    public List<DemoBooking> getAllDemoBookings() {
        return demoBookingRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<DemoBooking> getDemoBookingsByStatus(DemoBooking.BookingStatus status) {
        return demoBookingRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public List<DemoBooking> getDemoBookingsByCourse(String course) {
        return demoBookingRepository.findByPreferredCourseOrderByCreatedAtDesc(course);
    }
    
    public DemoBooking saveDemoBooking(DemoBooking demoBooking) {
        return demoBookingRepository.save(demoBooking);
    }
    
    public Optional<DemoBooking> getDemoBookingById(Long id) {
        return demoBookingRepository.findById(id);
    }
    
    public DemoBooking updateDemoBooking(DemoBooking demoBooking) {
        return demoBookingRepository.save(demoBooking);
    }
    
    public void deleteDemoBooking(Long id) {
        demoBookingRepository.deleteById(id);
    }
    
    public DemoBooking updateBookingStatus(Long id, DemoBooking.BookingStatus status) {
        Optional<DemoBooking> bookingOpt = demoBookingRepository.findById(id);
        if (bookingOpt.isPresent()) {
            DemoBooking booking = bookingOpt.get();
            booking.setStatus(status);
            return demoBookingRepository.save(booking);
        }
        return null;
    }
}
