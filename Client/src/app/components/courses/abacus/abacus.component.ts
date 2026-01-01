import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SocialSidebarComponent } from '../../social-sidebar/social-sidebar.component';
import { ApiService } from '../../../services/api.service';
import { Feedback } from '../../../models/feedback.model';

@Component({
  selector: 'app-abacus',
  standalone: true,
  imports: [CommonModule, RouterModule, SocialSidebarComponent],
  templateUrl: './abacus.component.html',
  styleUrls: ['./abacus.component.css'],
})
export class AbacusComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  // Testimonials properties
  testimonials: Feedback[] = [];
  isLoadingTestimonials = false;
  private refreshInterval: any;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 3;
  totalPages = 0;

  // Levels carousel properties
  currentLevelIndex = 0;
  currentLevelOffset = 0;
  levelsPerView = 3;
  levelHeight = 300; // Height of each level item in pixels
  levelIndicators: number[] = [];
  totalLevels = 6; // Total number of levels

  // Auto-rotation properties
  private levelAutoRotateInterval: any;
  autoRotateDelay = 3000; // 3 seconds between rotations
  isResetting = false; // Control for reset transitions

  ngOnInit(): void {
    // Initialize scroll animations
    this.initScrollAnimations();
    // Load testimonials
    this.loadTestimonials();
    // Set up auto-refresh for testimonials (every 5 minutes)
    this.setupAutoRefresh();
    // Initialize levels carousel
    this.initializeLevelsCarousel();
    // Start auto-rotation for levels
    this.startLevelAutoRotation();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.levelAutoRotateInterval) {
      clearInterval(this.levelAutoRotateInterval);
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
          // Add staggered animation delays
          const siblings = Array.from(
            entry.target.parentElement?.children || []
          );
          const index = siblings.indexOf(entry.target);
          if (index > 0) {
            (entry.target as HTMLElement).style.transitionDelay = `${
              index * 0.1
            }s`;
          }
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
        // First try to get Abacus-specific feedback
        let abacusFeedbacks = feedbacks.filter(
          (feedback: any) =>
            feedback.isApproved === true && feedback.course === 'Abacus'
        );

        // If no Abacus-specific feedback, show all approved feedback
        if (abacusFeedbacks.length === 0) {
          this.testimonials = feedbacks.filter(
            (feedback: any) => feedback.isApproved === true
          );
        } else {
          this.testimonials = abacusFeedbacks;
        }

        // If still no testimonials, use fallback data
        if (this.testimonials.length === 0) {
          this.testimonials = this.getSampleTestimonials();
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
        this.totalPages = Math.ceil(
          this.testimonials.length / this.itemsPerPage
        );
        this.currentPage = 1;
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
          'My 7-year-old daughter can now do mental math faster than I can! The abacus program has boosted her confidence tremendously.',
        childName: 'Emma',
        childAge: 7,
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
          "The abacus training has improved my son's concentration and mathematical thinking. He's now ahead of his class!",
        childName: 'Alex',
        childAge: 9,
        course: 'Abacus',
        createdAt: new Date('2024-01-10'),
        isApproved: true,
      },
      {
        id: 3,
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        rating: 5,
        message:
          "My daughter's math anxiety is completely gone. The abacus method makes learning fun and engaging!",
        childName: 'Maya',
        childAge: 8,
        course: 'Abacus',
        createdAt: new Date('2024-01-08'),
        isApproved: true,
      },
      {
        id: 4,
        name: 'David Rodriguez',
        email: 'david.rodriguez@email.com',
        rating: 5,
        message:
          'The abacus program has transformed my child from dreading math to loving it. The interactive online classes are excellent!',
        childName: 'Lucas',
        childAge: 10,
        course: 'Abacus',
        createdAt: new Date('2024-01-05'),
        isApproved: true,
      },
      {
        id: 5,
        name: 'Jennifer Kim',
        email: 'jennifer.kim@email.com',
        rating: 5,
        message:
          'Amazing results! My son can calculate faster mentally than with a calculator. Highly recommend this program!',
        childName: 'Ethan',
        childAge: 12,
        course: 'Abacus',
        createdAt: new Date('2024-01-03'),
        isApproved: true,
      },
      {
        id: 6,
        name: 'Robert Taylor',
        email: 'robert.taylor@email.com',
        rating: 5,
        message:
          'Tiny Vivid Minds has made math learning so engaging. The teachers are patient and the curriculum is well-structured.',
        childName: 'Olivia',
        childAge: 6,
        course: 'Abacus',
        createdAt: new Date('2024-01-01'),
        isApproved: true,
      },
    ];
  }

  // Levels carousel methods
  initializeLevelsCarousel(): void {
    // Initialize level indicators array for all 6 levels
    this.levelIndicators = Array.from(
      { length: this.totalLevels },
      (_, i) => i
    );
  }

  scrollLevelsUp(): void {
    // Disabled - only forward movement allowed
  }

  scrollLevelsDown(): void {
    this.currentLevelIndex = (this.currentLevelIndex + 1) % this.totalLevels;
    this.updateLevelOffset();
    this.onLevelInteraction(); // Pause auto-rotation on user interaction
  }

  goToLevel(index: number): void {
    // Disabled - only forward movement allowed
  }

  private updateLevelOffset(): void {
    // Create infinite circular movement: 1 → 2 → 3 → 4 → 5 → 6 → 1 → 2 → 3 → 4 → 5 → 6...
    // Now with all 12 levels, we can move smoothly through all positions
    this.currentLevelOffset = -this.currentLevelIndex * this.levelHeight;
  }

  // Auto-rotation methods
  startLevelAutoRotation(): void {
    this.levelAutoRotateInterval = setInterval(() => {
      this.autoRotateLevels();
    }, this.autoRotateDelay);
  }

  stopLevelAutoRotation(): void {
    if (this.levelAutoRotateInterval) {
      clearInterval(this.levelAutoRotateInterval);
      this.levelAutoRotateInterval = null;
    }
  }

  private autoRotateLevels(): void {
    // Move to next level infinitely: 1 → 2 → 3 → 4 → 5 → 6 → 1 → 2 → 3 → 4 → 5 → 6 → 1 → 2...
    this.currentLevelIndex++;

    // When we reach the end of all levels (position 12), reset to the beginning (position 0)
    if (this.currentLevelIndex >= 12) {
      // Disable transition for instant reset
      this.isResetting = true;
      this.currentLevelIndex = 0;
      this.currentLevelOffset = 0;

      // Re-enable transition after reset
      setTimeout(() => {
        this.isResetting = false;
      }, 50);
    } else {
      this.isResetting = false;
      this.updateLevelOffset();
    }
  }

  // Pause auto-rotation on user interaction
  onLevelInteraction(): void {
    this.stopLevelAutoRotation();
    // Restart auto-rotation after a delay
    setTimeout(() => {
      this.startLevelAutoRotation();
    }, 10000); // Wait 10 seconds before resuming auto-rotation
  }
}
