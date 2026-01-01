import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SocialSidebarComponent } from '../components/social-sidebar/social-sidebar.component';
import { ApiService } from '../services/api.service';
import { Feedback } from '../models/feedback.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, SocialSidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  activeFaqIndex: number | null = null;

  // Testimonials properties
  testimonials: Feedback[] = [];
  currentTestimonialIndex = 0;
  isLoadingTestimonials = false;
  testimonialsPerPage = 1; // Show one testimonial at a time
  totalPages = 0;
  private refreshInterval: any;

  ngOnInit(): void {
    // Initialize scroll animations
    this.initScrollAnimations();
    // Initialize FAQ accordion
    this.initFaqAccordion();
    // Load testimonials
    this.loadTestimonials();
    // Set up auto-refresh for testimonials (every 5 minutes)
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private initScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll(
      '.fade-in, .slide-in-left, .slide-in-right'
    );
    animatedElements.forEach((el) => observer.observe(el));
  }

  private initFaqAccordion(): void {
    // FAQ accordion functionality will be handled by click events
  }

  toggleFaq(index: number): void {
    if (this.activeFaqIndex === index) {
      this.activeFaqIndex = null;
    } else {
      this.activeFaqIndex = index;
    }
  }

  isFaqActive(index: number): boolean {
    return this.activeFaqIndex === index;
  }

  // Testimonials methods
  loadTestimonials(): void {
    this.isLoadingTestimonials = true;
    this.apiService.getFeedbacks().subscribe({
      next: (feedbacks: any) => {
        // Filter only approved feedbacks for testimonials
        this.testimonials = feedbacks.filter(
          (feedback: any) => feedback.isApproved === true
        );
        this.totalPages = this.testimonials.length;
        this.isLoadingTestimonials = false;
      },
      error: (error: any) => {
        console.error('Error loading testimonials:', error);
        this.isLoadingTestimonials = false;
        // Fallback to sample testimonials if API fails
        this.testimonials = this.getSampleTestimonials();
        this.totalPages = this.testimonials.length;
      },
    });
  }

  getCurrentTestimonial(): Feedback | null {
    if (this.testimonials.length === 0) return null;
    return this.testimonials[this.currentTestimonialIndex];
  }

  nextTestimonial(): void {
    if (this.currentTestimonialIndex < this.testimonials.length - 1) {
      this.currentTestimonialIndex++;
    } else {
      this.currentTestimonialIndex = 0; // Loop back to first
    }
  }

  prevTestimonial(): void {
    if (this.currentTestimonialIndex > 0) {
      this.currentTestimonialIndex--;
    } else {
      this.currentTestimonialIndex = this.testimonials.length - 1; // Loop to last
    }
  }

  goToTestimonial(index: number): void {
    if (index >= 0 && index < this.testimonials.length) {
      this.currentTestimonialIndex = index;
    }
  }

  generateStars(rating: number): string[] {
    return Array(5)
      .fill('')
      .map((_, index) => (index < rating ? 'fas fa-star' : 'far fa-star'));
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) {
      return 'Date not available';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private setupAutoRefresh(): void {
    // Refresh testimonials every 5 minutes (300000 ms)
    this.refreshInterval = setInterval(() => {
      this.loadTestimonials();
    }, 300000);
  }

  // Public method to manually refresh testimonials (can be called from other components)
  public refreshTestimonials(): void {
    this.loadTestimonials();
  }

  private getSampleTestimonials(): Feedback[] {
    return [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        rating: 5,
        message:
          "My daughter's math skills have dramatically improved. She now loves numbers!",
        childName: 'Emma',
        childAge: 8,
        course: 'Abacus',
        createdAt: new Date('2024-01-15'),
        isApproved: true,
      },
      {
        id: 2,
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        rating: 5,
        message:
          'The personalized coaching has made such a difference. My son went from struggling to loving math!',
        childName: 'Alex',
        childAge: 10,
        course: 'Personalized Coaching',
        createdAt: new Date('2024-01-10'),
        isApproved: true,
      },
      {
        id: 3,
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        rating: 5,
        message:
          'Vedic Maths techniques are incredible! My daughter can solve complex problems in seconds now.',
        childName: 'Maya',
        childAge: 12,
        course: 'Vedic Maths',
        createdAt: new Date('2024-01-08'),
        isApproved: true,
      },
    ];
  }
}
