package com.example.TVM.service;

import com.example.TVM.entity.Contact;
import com.example.TVM.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ContactService {
    
    @Autowired
    private ContactRepository contactRepository;
    
    public List<Contact> getAllContacts() {
        return contactRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Contact> getContactsByStatus(Contact.ContactStatus status) {
        return contactRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    public Contact saveContact(Contact contact) {
        return contactRepository.save(contact);
    }
    
    public Optional<Contact> getContactById(Long id) {
        return contactRepository.findById(id);
    }
    
    public Contact updateContact(Contact contact) {
        return contactRepository.save(contact);
    }
    
    public void deleteContact(Long id) {
        contactRepository.deleteById(id);
    }
    
    public Contact updateContactStatus(Long id, Contact.ContactStatus status) {
        Optional<Contact> contactOpt = contactRepository.findById(id);
        if (contactOpt.isPresent()) {
            Contact contact = contactOpt.get();
            contact.setStatus(status);
            return contactRepository.save(contact);
        }
        return null;
    }
}
