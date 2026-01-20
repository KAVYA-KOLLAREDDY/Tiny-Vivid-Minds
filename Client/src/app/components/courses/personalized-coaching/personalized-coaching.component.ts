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
    console.log('🚀 Personalized Coaching Component Initialized');

    // Initialize scroll animations
    this.initScrollAnimations();
    console.log('✨ Scroll animations initialized');

    // Load testimonials
    this.loadTestimonials();

    // Set up auto-refresh for testimonials (every 5 minutes)
    this.setupAutoRefresh();
    console.log('🔄 Auto-refresh setup for testimonials (every 5 minutes)');

    // Start carousel auto-play
    this.startAutoPlay();
    console.log('🎠 Carousel auto-play started');

    // Log initialization summary
    setTimeout(() => {
      console.log('🎉 Personalized Coaching Component Initialization Complete:', {
        testimonials: {
          loaded: this.testimonials.length,
          isLoading: this.isLoadingTestimonials,
          currentPage: this.currentPage,
          totalPages: this.totalPages
        },
        carousel: {
          courses: this.courses.length,
          currentSlide: this.currentSlide + 1,
          autoPlay: this.isAutoPlaying
        },
        animations: 'Initialized',
        autoRefresh: 'Active (5 min intervals)',
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    console.log('🗑️ Personalized Coaching Component destroying...');

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      console.log('🛑 Cleared testimonials refresh interval');
    }

    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      console.log('🛑 Cleared carousel autoplay interval');
    }

    console.log('✅ Component cleanup completed');
  }

  private initScrollAnimations(): void {
    console.log('🎬 Initializing scroll animations');

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const elementClass = entry.target.className;
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

          console.log(`✨ Element became visible: ${elementClass}`, {
            delay: index > 0 ? `${index * 0.1}s` : 'none'
          });
        }
      });
    }, observerOptions);

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll(
      '.fade-in, .slide-in-left, .slide-in-right, .scale-in'
    );

    console.log(`👁️ Setting up intersection observer for ${animatedElements.length} animated elements`);
    animatedElements.forEach((el, index) => {
      observer.observe(el);
      console.log(`📍 Observing element ${index + 1}: ${el.className}`);
    });

    // Initialize parallax effects
    this.initParallaxEffects();
  }

  private initParallaxEffects(): void {
    const parallaxElements = document.querySelectorAll(
      '.parallax-slow, .parallax-fast'
    );

    console.log(`🌊 Initializing parallax effects for ${parallaxElements.length} elements`);

    parallaxElements.forEach((element, index) => {
      const speed = element.classList.contains('parallax-slow') ? 0.5 : 0.8;
      console.log(`📍 Parallax element ${index + 1}: ${element.className} (speed: ${speed})`);
    });

    let scrollCount = 0;
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      scrollCount++;

      // Only log every 10th scroll event to avoid spam
      if (scrollCount % 10 === 0) {
        console.log(`📜 Scroll position: ${Math.round(scrolled)}px`);
      }

      parallaxElements.forEach((element, index) => {
        const speed = element.classList.contains('parallax-slow') ? 0.5 : 0.8;
        const yPos = -(scrolled * speed);

        if (scrollCount % 50 === 0) { // Log less frequently
          console.log(`🌊 Parallax element ${index + 1} transform: translateY(${Math.round(yPos)}px)`);
        }

        (element as HTMLElement).style.transform = `translateY(${yPos}px)`;
      });
    });

    console.log('✅ Parallax effects initialized');
  }

  // Testimonials methods
  loadTestimonials(): void {
    console.log('📝 Loading testimonials from API...');
    this.isLoadingTestimonials = true;

    this.apiService.getFeedbacks().subscribe({
      next: (feedbacks: any) => {
        console.log('✅ Testimonials API Response:', feedbacks);

        // First try to get Personalized Coaching-specific feedback
        let coachingFeedbacks = feedbacks.filter(
          (feedback: any) =>
            feedback.isApproved === true &&
            feedback.course === 'Personalized Coaching'
        );

        console.log(`🎯 Found ${coachingFeedbacks.length} Personalized Coaching testimonials`);

        // If no Personalized Coaching-specific feedback, show all approved feedback
        if (coachingFeedbacks.length === 0) {
          this.testimonials = feedbacks.filter(
            (feedback: any) => feedback.isApproved === true
          );
          console.log(`📊 No specific coaching feedback found, using ${this.testimonials.length} general approved testimonials`);
        } else {
          this.testimonials = coachingFeedbacks;
          console.log(`✅ Using ${coachingFeedbacks.length} Personalized Coaching testimonials`);
        }

        // Calculate pagination
        this.totalPages = Math.ceil(
          this.testimonials.length / this.itemsPerPage
        );
        this.currentPage = 1; // Reset to first page when data loads

        console.log(`📄 Pagination calculated: ${this.totalPages} pages (${this.itemsPerPage} items per page)`);
        console.log('🎉 Testimonials loaded successfully:', {
          totalTestimonials: this.testimonials.length,
          currentPage: this.currentPage,
          totalPages: this.totalPages,
          sampleTestimonial: this.testimonials[0] ? {
            name: this.testimonials[0].name,
            rating: this.testimonials[0].rating,
            course: this.testimonials[0].course
          } : null
        });

        this.isLoadingTestimonials = false;
      },
      error: (error: any) => {
        console.error('❌ Testimonials API failed:', error);
        console.log('🔄 Falling back to sample testimonials');

        this.isLoadingTestimonials = false;
        // Fallback to sample testimonials if API fails
        this.testimonials = this.getSampleTestimonials();

        // Calculate pagination for sample data
        this.totalPages = Math.ceil(
          this.testimonials.length / this.itemsPerPage
        );
        this.currentPage = 1;

        console.log('✅ Sample testimonials loaded as fallback:', {
          count: this.testimonials.length,
          totalPages: this.totalPages
        });
      },
    });
  }

  generateStars(rating: number): string[] {
    const stars = Array(5)
      .fill('')
      .map((_, index) => (index < rating ? 'fas fa-star' : 'far fa-star'));

    console.log(`⭐ Generated star rating for ${rating} stars:`, stars);
    return stars;
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) {
      console.log('📅 Date formatting: No date provided');
      return 'Date not available';
    }

    const date = new Date(dateString);
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    console.log(`📅 Formatted date: ${dateString} → ${formatted}`);
    return formatted;
  }

  private setupAutoRefresh(): void {
    // Refresh testimonials every 5 minutes (300000 ms)
    console.log('⏰ Setting up auto-refresh interval (5 minutes)');
    this.refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing testimonials...');
      this.loadTestimonials();
    }, 300000);
  }

  // Public method to manually refresh testimonials
  public refreshTestimonials(): void {
    console.log('🔄 Manual refresh triggered for testimonials');
    this.loadTestimonials();
  }

  // Pagination methods
  getCurrentPageTestimonials(): Feedback[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const currentPageItems = this.testimonials.slice(startIndex, endIndex);

    console.log(`📄 Getting testimonials for page ${this.currentPage}/${this.totalPages}:`, {
      startIndex,
      endIndex,
      itemsOnPage: currentPageItems.length,
      totalItems: this.testimonials.length
    });

    return currentPageItems;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      console.log(`➡️ Navigated to page ${this.currentPage}/${this.totalPages}`);
    } else {
      console.log('❌ Cannot navigate to next page - already on last page');
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      console.log(`⬅️ Navigated to page ${this.currentPage}/${this.totalPages}`);
    } else {
      console.log('❌ Cannot navigate to previous page - already on first page');
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      console.log(`🔢 Jumped to page ${this.currentPage}/${this.totalPages}`);
    } else {
      console.log(`❌ Invalid page number ${page} - must be between 1 and ${this.totalPages}`);
    }
  }

  // Carousel methods
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.courses.length;
    console.log(`🎠 Next slide: ${this.currentSlide + 1}/${this.courses.length} (${this.courses[this.currentSlide].title})`);
    this.resetAutoPlay();
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.courses.length) % this.courses.length;
    console.log(`🎠 Previous slide: ${this.currentSlide + 1}/${this.courses.length} (${this.courses[this.currentSlide].title})`);
    this.resetAutoPlay();
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    console.log(`🎠 Jumped to slide: ${this.currentSlide + 1}/${this.courses.length} (${this.courses[this.currentSlide].title})`);
    this.resetAutoPlay();
  }

  private startAutoPlay(): void {
    console.log('▶️ Starting carousel autoplay (5 second intervals)');
    this.autoPlayInterval = setInterval(() => {
      if (this.isAutoPlaying) {
        this.nextSlide();
      }
    }, 5000); // Change slide every 5 seconds
  }

  private resetAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      console.log('🔄 Resetting autoplay timer');
    }
    this.startAutoPlay();
  }

  toggleAutoPlay(): void {
    this.isAutoPlaying = !this.isAutoPlaying;
    console.log(`${this.isAutoPlaying ? '▶️' : '⏸️'} Autoplay ${this.isAutoPlaying ? 'enabled' : 'disabled'}`);

    if (this.isAutoPlaying) {
      this.startAutoPlay();
    } else if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  onCarouselMouseEnter(): void {
    console.log('🖱️ Mouse entered carousel - pausing autoplay');
    this.isAutoPlaying = false;
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  onCarouselMouseLeave(): void {
    console.log('🖱️ Mouse left carousel - resuming autoplay');
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
