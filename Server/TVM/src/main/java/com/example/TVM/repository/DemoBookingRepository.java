package com.example.TVM.repository;

import com.example.TVM.entity.DemoBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemoBookingRepository extends JpaRepository<DemoBooking, Long> {
    
    List<DemoBooking> findByStatusOrderByCreatedAtDesc(DemoBooking.BookingStatus status);
    
    List<DemoBooking> findAllByOrderByCreatedAtDesc();
    
    List<DemoBooking> findByPreferredCourseOrderByCreatedAtDesc(String course);
}
