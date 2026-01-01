package com.example.TVM.repository;

import com.example.TVM.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    
    List<Contact> findByStatusOrderByCreatedAtDesc(Contact.ContactStatus status);
    
    List<Contact> findAllByOrderByCreatedAtDesc();
}
