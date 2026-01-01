import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SocialSidebarComponent } from '../../social-sidebar/social-sidebar.component';
import { ApiService } from '../../../services/api.service';
import { Feedback } from '../../../models/feedback.model';

@Component({
  selector: 'app-personalized-coaching',
  standalone: true,
  imports: [CommonModule, RouterModule, SocialSidebarComponent],
  templateUrl: './personalized-coaching.component.html',
  styleUrls: ['./personalized-coaching.component.css'],
})
export class PersonalizedCoachingComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);

  // Testimonials properties
  testimonials: Feedback[] = [];
  isLoadingTestimonials = false;
  private refreshInterval: any;

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 2;
  totalPages = 0;

  // Carousel properties
  courses = [
    {
      id: 1,
      title: 'Mathematics',
      description: 'Master numbers, geometry, and problem-solving through personalized one-on-one math instruction designed for your child\'s learning pace.',
      image: '/abacusBackside3.png',
      icon: 'fas fa-calculator',
      color: 'primary'
    },
    {
      id: 2,
      title: 'HandWriting',
      description: 'Develop beautiful, legible handwriting through structured practice and personalized guidance that builds confidence and fine motor skills.',
      image: '/abacusBackside2.jpeg',
      icon: 'fas fa-pen-fancy',
      color: 'secondary'
    },
    {
      id: 3,
      title: 'Phonetics',
      description: 'Build strong reading and spelling foundations with systematic phonics instruction tailored to your child\'s reading level and learning style.',
      image: '/abacusBackside.jpeg',
      icon: 'fas fa-book-open',
      color: 'accent'
    }
  ];
  currentSlide = 0;
  autoPlayInterval: any;
  isAutoPlaying = true;

  ngOnInit(): void {
    // Initialize scroll animations
    this.initScrollAnimations();
    // Load testimonials
    this.loadTestimonials();
    // Set up auto-refresh for testimonials (every 5 minutes)
    this.setupAutoRefresh();
    // Start carousel auto-play
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
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

    // Initialize parallax effects
    this.initParallaxEffects();
  }

  private initParallaxEffects(): void {
    const parallaxElements = document.querySelectorAll(
      '.parallax-slow, .parallax-fast'
    );

    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach((element) => {
        const speed = element.classList.contains('parallax-slow') ? 0.5 : 0.8;
        const yPos = -(scrolled * speed);
        (element as HTMLElement).style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  // Testimonials methods
  loadTestimonials(): void {
    this.isLoadingTestimonials = true;
    this.apiService.getFeedbacks().subscribe({
      next: (feedbacks: any) => {
        // First try to get Personalized Coaching-specific feedback
        let coachingFeedbacks = feedbacks.filter(
          (feedback: any) =>
            feedback.isApproved === true &&
            feedback.course === 'Personalized Coaching'
        );

        // If no Personalized Coaching-specific feedback, show all approved feedback
        if (coachingFeedbacks.length === 0) {
          this.testimonials = feedbacks.filter(
            (feedback: any) => feedback.isApproved === true
          );
        } else {
          this.testimonials = coachingFeedbacks;
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

  // Carousel methods
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.courses.length;
    this.resetAutoPlay();
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.courses.length) % this.courses.length;
    this.resetAutoPlay();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.resetAutoPlay();
  }

  private startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      if (this.isAutoPlaying) {
        this.nextSlide();
      }
    }, 5000); // Change slide every 5 seconds
  }

  private resetAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    this.startAutoPlay();
  }

  toggleAutoPlay(): void {
    this.isAutoPlaying = !this.isAutoPlaying;
    if (this.isAutoPlaying) {
      this.startAutoPlay();
    } else if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  onCarouselMouseEnter(): void {
    this.isAutoPlaying = false;
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  onCarouselMouseLeave(): void {
    this.isAutoPlaying = true;
    this.startAutoPlay();
  }

  private getSampleTestimonials(): Feedback[] {
    return [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        rating: 5,
        message:
          'The personalized approach has made such a difference. My daughter went from struggling to loving math in just a few months.',
        childName: 'Emma',
        childAge: 10,
        course: 'Personalized Coaching',
        createdAt: new Date('2024-01-15'),
        isApproved: true,
      },
      {
        id: 2,
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        rating: 5,
        message:
          'The flexibility of scheduling and the customized curriculum have been perfect for our busy family schedule.',
        childName: 'Alex',
        childAge: 12,
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
          'The one-on-one attention has helped my son overcome his math anxiety and build real confidence in his abilities.',
        childName: 'Maya',
        childAge: 9,
        course: 'Personalized Coaching',
        createdAt: new Date('2024-01-08'),
        isApproved: true,
      },
    ];
  }
}
