import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';

interface Feedback {
  id?: number;
  name: string;
  email: string;
  rating: number;
  message: string;
  childName?: string;
  childAge?: number;
  course?: string;
  createdAt?: string;
  isApproved?: boolean;
  isFeatured?: boolean;
}

interface DemoBooking {
  id?: number;
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childAge: number;
  preferredCourse: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  createdAt?: string;
  status?: string;
}

interface Contact {
  id?: number;
  name: string;
  email: string;
  phone: string;
  subject?: string;
  message: string;
  createdAt?: string;
  status?: string;
}

type TabType = 'feedback' | 'demo-requests' | 'contact-messages';

@Component({
  selector: 'app-feedback-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-reports.component.html',
  styleUrls: ['./feedback-reports.component.css']
})
export class FeedbackReportsComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  activeTab = signal<TabType>('feedback');
  
  feedbacks = signal<Feedback[]>([]);
  demoBookings = signal<DemoBooking[]>([]);
  contacts = signal<Contact[]>([]);
  
  isLoading = signal<boolean>(false);
  isLoadingFeedbacks = signal<boolean>(false);
  isLoadingDemos = signal<boolean>(false);
  isLoadingContacts = signal<boolean>(false);
  
  // Modal states
  showFeedbackModal = signal<boolean>(false);
  showDemoModal = signal<boolean>(false);
  showContactModal = signal<boolean>(false);
  selectedFeedback = signal<Feedback | null>(null);
  selectedDemo = signal<DemoBooking | null>(null);
  selectedContact = signal<Contact | null>(null);

  ngOnInit() {
    console.log('🚀 FeedbackReportsComponent initialized');
    this.loadData();
  }

  loadData() {
    console.log('🔄 loadData() called');
    this.isLoading.set(true);
    let feedbacksLoaded = false;
    let demosLoaded = false;
    let contactsLoaded = false;
    
    const checkAllLoaded = () => {
      console.log('✅ Checking if all data loaded:', { feedbacksLoaded, demosLoaded, contactsLoaded });
      if (feedbacksLoaded && demosLoaded && contactsLoaded) {
        console.log('✅ All data loaded, setting isLoading to false');
        this.isLoading.set(false);
      }
    };
    
    this.loadFeedbacks(() => {
      feedbacksLoaded = true;
      checkAllLoaded();
    });
    this.loadDemoBookings(() => {
      demosLoaded = true;
      checkAllLoaded();
    });
    this.loadContacts(() => {
      contactsLoaded = true;
      checkAllLoaded();
    });
  }

  loadFeedbacks(onComplete?: () => void) {
    console.log('🌐 Fetching feedbacks from API...');
    this.isLoadingFeedbacks.set(true);
    this.apiService.getAllFeedbacks().subscribe({
      next: (response: any) => {
        console.log('✅ Feedbacks API response received:', response);
        try {
          // Handle different response structures
          let feedbacksData = response;
          if (response?.data) {
            feedbacksData = response.data;
            console.log('📊 Extracted feedbacks from response.data');
          } else if (response?.body) {
            feedbacksData = response.body;
            console.log('📊 Extracted feedbacks from response.body');
          }
          
          // Ensure it's an array
          const feedbacksArray = Array.isArray(feedbacksData) ? feedbacksData : [];
          console.log('📋 Feedbacks array:', feedbacksArray);
          console.log('📋 Feedbacks count:', feedbacksArray.length);
          
          // Map and normalize the data structure
          const mappedFeedbacks: Feedback[] = feedbacksArray.map((feedback: any) => ({
            id: feedback.id || feedback.feedbackId,
            name: feedback.name || feedback.parentName || feedback.studentName || 'Anonymous',
            email: feedback.email || '',
            rating: feedback.rating || 0,
            message: feedback.message || feedback.comment || feedback.comments || '',
            childName: feedback.childName || feedback.studentName,
            childAge: feedback.childAge || feedback.studentAge,
            course: feedback.course || feedback.courseName || 'General',
            createdAt: feedback.createdAt || feedback.createdDate || feedback.dateCreated,
            isApproved: feedback.isApproved !== undefined ? feedback.isApproved : (feedback.approved || false),
            isFeatured: feedback.isFeatured !== undefined ? feedback.isFeatured : (feedback.featured || false)
          }));
          
          console.log('✅ Mapped feedbacks:', mappedFeedbacks);
          this.feedbacks.set(mappedFeedbacks);
          console.log('✅ Feedbacks signal set:', this.feedbacks());
          this.isLoadingFeedbacks.set(false);
          onComplete?.();
        } catch (error) {
          console.error('❌ Error processing feedbacks:', error);
          this.feedbacks.set([]);
          this.loggingService.onError('Failed to load feedbacks');
          this.isLoadingFeedbacks.set(false);
          onComplete?.();
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading feedbacks:', error);
        this.feedbacks.set([]);
        this.loggingService.onError('Failed to load feedbacks. Please try again.');
        this.isLoadingFeedbacks.set(false);
        onComplete?.();
      }
    });
  }

  loadDemoBookings(onComplete?: () => void) {
    console.log('🌐 Fetching demo bookings from API...');
    this.isLoadingDemos.set(true);
    this.apiService.getAllDemoBookings().subscribe({
      next: (response: any) => {
        console.log('✅ Demo bookings API response received:', response);
        try {
          // Handle different response structures
          let demosData = response;
          if (response?.data) {
            demosData = response.data;
            console.log('📊 Extracted demo bookings from response.data');
          } else if (response?.body) {
            demosData = response.body;
            console.log('📊 Extracted demo bookings from response.body');
          }
          
          // Ensure it's an array
          const demosArray = Array.isArray(demosData) ? demosData : [];
          console.log('📋 Demo bookings array:', demosArray);
          console.log('📋 Demo bookings count:', demosArray.length);
          
          // Map and normalize the data structure
          const mappedDemos: DemoBooking[] = demosArray.map((demo: any) => ({
            id: demo.id || demo.bookingId || demo.demoBookingId,
            parentName: demo.parentName || demo.name || demo.parent?.name || 'Unknown',
            email: demo.email || demo.parent?.email || '',
            phone: demo.phone || demo.contactNumber || demo.parent?.phone || '',
            childName: demo.childName || demo.studentName || 'N/A',
            childAge: demo.childAge || demo.studentAge || 0,
            preferredCourse: demo.preferredCourse || demo.course || demo.courseName || 'General',
            preferredDate: demo.preferredDate || demo.date || demo.scheduledDate || 'TBD',
            preferredTime: demo.preferredTime || demo.time || demo.scheduledTime || 'TBD',
            message: demo.message || demo.notes || demo.comments || '',
            createdAt: demo.createdAt || demo.createdDate || demo.dateCreated,
            status: demo.status || 'PENDING'
          }));
          
          console.log('✅ Mapped demo bookings:', mappedDemos);
          this.demoBookings.set(mappedDemos);
          console.log('✅ Demo bookings signal set:', this.demoBookings());
          this.isLoadingDemos.set(false);
          onComplete?.();
        } catch (error) {
          console.error('❌ Error processing demo bookings:', error);
          this.demoBookings.set([]);
          this.loggingService.onError('Failed to load demo bookings');
          this.isLoadingDemos.set(false);
          onComplete?.();
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading demo bookings:', error);
        this.demoBookings.set([]);
        this.loggingService.onError('Failed to load demo bookings. Please try again.');
        this.isLoadingDemos.set(false);
        onComplete?.();
      }
    });
  }

  loadContacts(onComplete?: () => void) {
    console.log('🌐 Fetching contacts from API...');
    this.isLoadingContacts.set(true);
    this.apiService.getAllContacts().subscribe({
      next: (response: any) => {
        console.log('✅ Contacts API response received:', response);
        try {
          // Handle different response structures
          let contactsData = response;
          if (response?.data) {
            contactsData = response.data;
            console.log('📊 Extracted contacts from response.data');
          } else if (response?.body) {
            contactsData = response.body;
            console.log('📊 Extracted contacts from response.body');
          }
          
          // Ensure it's an array
          const contactsArray = Array.isArray(contactsData) ? contactsData : [];
          console.log('📋 Contacts array:', contactsArray);
          console.log('📋 Contacts count:', contactsArray.length);
          
          // Map and normalize the data structure
          const mappedContacts: Contact[] = contactsArray.map((contact: any) => ({
            id: contact.id || contact.contactId,
            name: contact.name || contact.fullName || 'Anonymous',
            email: contact.email || '',
            phone: contact.phone || contact.contactNumber || contact.phoneNumber || '',
            subject: contact.subject || contact.topic || 'N/A',
            message: contact.message || contact.content || contact.comments || '',
            createdAt: contact.createdAt || contact.createdDate || contact.dateCreated,
            status: contact.status || 'NEW'
          }));
          
          console.log('✅ Mapped contacts:', mappedContacts);
          this.contacts.set(mappedContacts);
          console.log('✅ Contacts signal set:', this.contacts());
          this.isLoadingContacts.set(false);
          onComplete?.();
        } catch (error) {
          console.error('❌ Error processing contacts:', error);
          this.contacts.set([]);
          this.loggingService.onError('Failed to load contacts');
          this.isLoadingContacts.set(false);
          onComplete?.();
        }
      },
      error: (error: any) => {
        console.error('❌ Error loading contacts:', error);
        this.contacts.set([]);
        this.loggingService.onError('Failed to load contacts. Please try again.');
        this.isLoadingContacts.set(false);
        onComplete?.();
      }
    });
  }

  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
  }

  // Feedback Actions
  openFeedbackModal(feedback: Feedback) {
    this.selectedFeedback.set(feedback);
    this.showFeedbackModal.set(true);
  }

  closeFeedbackModal() {
    this.showFeedbackModal.set(false);
    this.selectedFeedback.set(null);
  }

  approveFeedback(feedbackId: number) {
    console.log('🔄 Approving feedback:', feedbackId);
    this.apiService.approveFeedback(feedbackId).subscribe({
      next: (response: any) => {
        console.log('✅ Feedback approved successfully:', response);
        this.loggingService.onSuccess('Feedback approved successfully!');
        // Update local state immediately
        this.feedbacks.update(feedbacks => 
          feedbacks.map(f => f.id === feedbackId ? { ...f, isApproved: true } : f)
        );
        // Reload from server
        this.loadFeedbacks();
      },
      error: (error: any) => {
        console.error('❌ Error approving feedback:', error);
        this.loggingService.onError('Failed to approve feedback. Please try again.');
      }
    });
  }

  rejectFeedback(feedbackId: number) {
    if (confirm('Are you sure you want to reject this feedback? This action cannot be undone.')) {
      console.log('🔄 Rejecting feedback:', feedbackId);
      this.apiService.rejectFeedback(feedbackId).subscribe({
        next: (response: any) => {
          console.log('✅ Feedback rejected successfully:', response);
          this.loggingService.onSuccess('Feedback rejected successfully!');
          // Remove from local state
          this.feedbacks.update(feedbacks => 
            feedbacks.filter(f => f.id !== feedbackId)
          );
          // Reload from server
          this.loadFeedbacks();
        },
        error: (error: any) => {
          console.error('❌ Error rejecting feedback:', error);
          this.loggingService.onError('Failed to reject feedback. Please try again.');
        }
      });
    }
  }

  featureFeedback(feedbackId: number) {
    // Note: This functionality would need to be added to the backend
    // For now, we'll show a message
    this.loggingService.onSuccess('Feature functionality will be implemented in the backend');
    // TODO: Add API endpoint for featuring feedback
    // this.apiService.featureFeedback(feedbackId).subscribe(...)
  }

  // Demo Booking Actions
  openDemoModal(demo: DemoBooking) {
    this.selectedDemo.set(demo);
    this.showDemoModal.set(true);
  }

  closeDemoModal() {
    this.showDemoModal.set(false);
    this.selectedDemo.set(null);
  }

  updateDemoStatus(bookingId: number, status: string) {
    console.log('🔄 Updating demo booking status:', { bookingId, status });
    this.apiService.updateDemoBookingStatus(bookingId, status).subscribe({
      next: (response: any) => {
        console.log('✅ Demo booking status updated successfully:', response);
        this.loggingService.onSuccess(`Demo booking status updated to ${status}!`);
        // Update local state immediately
        this.demoBookings.update(bookings => 
          bookings.map(b => b.id === bookingId ? { ...b, status } : b)
        );
        // Reload from server
        this.loadDemoBookings();
        this.closeDemoModal();
      },
      error: (error: any) => {
        console.error('❌ Error updating demo booking status:', error);
        this.loggingService.onError('Failed to update demo booking status. Please try again.');
      }
    });
  }

  // Contact Actions
  openContactModal(contact: Contact) {
    this.selectedContact.set(contact);
    this.showContactModal.set(true);
  }

  closeContactModal() {
    this.showContactModal.set(false);
    this.selectedContact.set(null);
  }

  updateContactStatus(contactId: number, status: string) {
    console.log('🔄 Updating contact status:', { contactId, status });
    this.apiService.updateContactStatus(contactId, status).subscribe({
      next: (response: any) => {
        console.log('✅ Contact status updated successfully:', response);
        this.loggingService.onSuccess(`Contact status updated to ${status}!`);
        // Update local state immediately
        this.contacts.update(contacts => 
          contacts.map(c => c.id === contactId ? { ...c, status } : c)
        );
        // Reload from server
        this.loadContacts();
        this.closeContactModal();
      },
      error: (error: any) => {
        console.error('❌ Error updating contact status:', error);
        this.loggingService.onError('Failed to update contact status. Please try again.');
      }
    });
  }

  // Helper methods
  getStatusClass(status?: string): string {
    if (!status) return 'status-unknown';
    const s = status.toUpperCase();
    if (s === 'APPROVED' || s === 'CONFIRMED' || s === 'REPLIED') return 'status-approved';
    if (s === 'PENDING' || s === 'NEW' || s === 'READ') return 'status-pending';
    if (s === 'REJECTED' || s === 'CANCELLED') return 'status-rejected';
    if (s === 'COMPLETED') return 'status-completed';
    return 'status-unknown';
  }

  getStatusDisplay(status?: string): string {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getMessageType(subject: string): string {
    if (!subject) return 'Enquiry';
    return subject.toLowerCase().includes('demo') ? 'Demo Request' : 'Enquiry';
  }

  getContactMessageType(contact: Contact | null | undefined): string {
    if (!contact) return 'Enquiry';
    const subject = contact.subject;
    if (!subject) return 'Enquiry';
    return subject.toLowerCase().includes('demo') ? 'Demo Request' : 'Enquiry';
  }
}

