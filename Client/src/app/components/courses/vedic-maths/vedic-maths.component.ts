import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SocialSidebarComponent } from '../../social-sidebar/social-sidebar.component';
import { ApiService } from '../../../services/api.service';
import { Feedback } from '../../../models/feedback.model';

@Component({
  selector: 'app-vedic-maths',
  standalone: true,
  imports: [CommonModule, RouterModule, SocialSidebarComponent],
  templateUrl: './vedic-maths.component.html',
  styleUrls: ['./vedic-maths.component.css'],
})
export class VedicMathsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  // Testimonials properties
  testimonials: Feedback[] = [];
  isLoadingTestimonials = false;
  private refreshInterval: any;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 2;
  totalPages = 0;

  ngOnInit(): void {
    // Initialize scroll animations
    this.initScrollAnimations();
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
      '.fade-in, .slide-in-left, .slide-in-right, .scale-in'
    );
    animatedElements.forEach((el) => observer.observe(el));
  }

  // Testimonials methods
  loadTestimonials(): void {
    this.isLoadingTestimonials = true;
    this.apiService.getFeedbacks().subscribe({
      next: (feedbacks: any) => {
        // First try to get Vedic Maths-specific feedback
        let vedicFeedbacks = feedbacks.filter(
          (feedback: any) =>
            feedback.isApproved === true && feedback.course === 'Vedic Maths'
        );

        // If no Vedic Maths-specific feedback, show all approved feedback
        if (vedicFeedbacks.length === 0) {
          this.testimonials = feedbacks.filter(
            (feedback: any) => feedback.isApproved === true
          );
        } else {
          this.testimonials = vedicFeedbacks;
        }

        // Calculate pagination
        this.totalPages = Math.ceil(
          this.testimonials.length / this.itemsPerPage
        );
        this.currentPage = 1; // Reset to first page when data loads

        this.isLoadingTestimonials = false;
      },
      error: (error: any) => {
        console.error('Error loading testimonials:', error);
        this.isLoadingTestimonials = false;
        // Fallback to sample testimonials if API fails
        this.testimonials = this.getSampleTestimonials();
      },
    });
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

  // Public method to manually refresh testimonials
  public refreshTestimonials(): void {
    this.loadTestimonials();
  }

  // Pagination methods
  getCurrentPageTestimonials(): Feedback[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.testimonials.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Scroll to levels section
  scrollToLevels(): void {
    const levelsSection = document.querySelector('.levels-section');
    if (levelsSection) {
      levelsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private getSampleTestimonials(): Feedback[] {
    return [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        rating: 5,
        message:
          'My son can now solve complex multiplication problems in seconds! Vedic Maths has transformed his confidence in mathematics.',
        childName: 'Emma',
        childAge: 12,
        course: 'Vedic Maths',
        createdAt: new Date('2024-01-15'),
        isApproved: true,
      },
      {
        id: 2,
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        rating: 5,
        message:
          'The pattern recognition skills my daughter has developed through Vedic Maths help her in all subjects, not just math.',
        childName: 'Alex',
        childAge: 10,
        course: 'Vedic Maths',
        createdAt: new Date('2024-01-10'),
        isApproved: true,
      },
      {
        id: 3,
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        rating: 5,
        message:
          'Vedic Maths made my son fall in love with mathematics. He now enjoys solving problems and looks forward to math class.',
        childName: 'Maya',
        childAge: 11,
        course: 'Vedic Maths',
        createdAt: new Date('2024-01-08'),
        isApproved: true,
      },
    ];
  }
}
