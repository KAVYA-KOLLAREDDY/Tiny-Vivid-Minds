import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-media',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css'],
})
export class MediaComponent implements OnInit, AfterViewInit {
  private sanitizer = inject(DomSanitizer);
  // ============================================
  // ADD YOUR INSTAGRAM VIDEO LINKS HERE
  // ============================================
  // You can add Instagram reel/post URLs in any of these formats:
  //
  // Option 1: Full reel URL (recommended)
  //   Example: 'https://www.instagram.com/reel/DKizx6xttOw/?igsh=dXdna2pwMWtxaHVz'
  //
  // Option 2: Full post URL
  //   Example: 'https://www.instagram.com/p/ABC123XYZ/'
  //
  // Option 3: Just the post/reel ID
  //   Example: 'DKizx6xttOw' or 'ABC123XYZ'
  //
  // Option 4: Direct embed URL
  //   Example: 'https://www.instagram.com/p/ABC123XYZ/embed/'
  //
  // The code will automatically convert any format to the embed format!
  // ============================================
  instagramReels = [
    {
      // ⬇️ ADD YOUR FIRST INSTAGRAM REEL URL HERE ⬇️
      // Paste your Instagram reel URL between the quotes below:
      embedUrl:
        'https://www.instagram.com/reel/DJgDiA4txfb/?igsh=MTVhczg0OHo2aHVo',
      caption: 'Our Abacus Level 1 stars at work 🌟',
    },
    {
      // ⬇️ ADD YOUR SECOND INSTAGRAM REEL URL HERE ⬇️
      // Paste your Instagram reel URL between the quotes below:
      embedUrl:
        'https://www.instagram.com/reel/DKizx6xttOw/?igsh=dXdna2pwMWtxaHVz',
      caption: 'Quick mental math challenge 🧠💡',
    },
    {
      // ⬇️ ADD YOUR THIRD INSTAGRAM REEL URL HERE ⬇️
      // Paste your Instagram reel URL between the quotes below:
      embedUrl:
        'https://www.instagram.com/reel/DJs6tbxtAeC/?igsh=MW5rbGJnc2p3aW5jeQ==',
      caption: 'Kids across the world solving together 🌎',
    },
  ];
  // ============================================

  // YouTube videos
  featuredVideoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // Placeholder

  // ============================================
  // YOUTUBE VIDEO LINKS FOR "Watch More" SECTION
  // ============================================
  // Add your YouTube video IDs here (just the ID, not the full URL)
  // Extract the video ID from URLs like: https://youtu.be/VIDEO_ID?si=...
  // ============================================
  playlistVideoIds = [
   'j4BNwKJLfb0', // From: https://youtu.be/CZ4pHDrLOlU?si=UpFw0XkvFc17xlx9
    'W5atWB1FszM', // From: https://youtu.be/8w5eDclKS_w?si=wNCfO2S0_Jzf7zJS
    '8w5eDclKS_w', // From: https://youtu.be/j4BNwKJLfb0?si=1VQzUVMuivlBUz-G
  ];

  videoTitles = [
    'Tips, Tricks & Learning Activities from Our Trainers',
    'Interactive Math Sessions & Student Showcases',
    'Learning Activities & Training Tips',
  ];
  // ============================================

  // Photo gallery - placeholder images
  galleryPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      caption: 'Our Little Achievers 💫',
    },
    {
      url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
      caption: 'Happy Learning Moments',
    },
    {
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      caption: 'Teachers Guiding Online',
    },
    {
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
      caption: 'Certificates & Achievements',
    },
    {
      url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800',
      caption: 'Interactive Learning',
    },
    {
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      caption: 'Confidence Building',
    },
  ];

  // Achievements stats for count-up animation
  achievementsStats = [
    { value: 200, suffix: '+', label: 'Happy Students', icon: 'fa-users' },
    { value: 5, suffix: '+', label: 'Countries', icon: 'fa-globe' },
    { value: 1000, suffix: '+', label: 'Hours of Learning', icon: 'fa-clock' },
  ];

  // Achievement images
  achievementImages = [
    {
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      caption: 'National Competition Winners 🏅',
    },
    {
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
      caption: 'Digital Certificates Achieved 📜',
    },
    {
      url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
      caption: 'Virtual Event Highlights 🎉',
    },
    {
      url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800',
      caption: 'Personal Milestones Reached ⭐',
    },
  ];

  // Count-up animation values
  animatedValues: { [key: number]: number } = {};
  private countUpAnimated = false;

  ngOnInit(): void {
    // Any initialization logic
  }

  ngAfterViewInit(): void {
    // Add scroll animations
    this.observeElements();
    // Initialize count-up animation
    this.initCountUpAnimation();
  }

  private observeElements(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    // Observe the achievements section specifically for count-up animation
    const achievementsSectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.countUpAnimated) {
            this.animateCountUp();
            this.countUpAnimated = true;
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px',
      }
    );

    const achievementsSection = document.querySelector('.achievements-section');
    if (achievementsSection) {
      achievementsSectionObserver.observe(achievementsSection);
    }
  }

  private initCountUpAnimation(): void {
    // Initialize all animated values to 0
    this.achievementsStats.forEach((stat, index) => {
      this.animatedValues[index] = 0;
    });
  }

  private animateCountUp(): void {
    this.achievementsStats.forEach((stat, index) => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = stat.value / steps;
      const stepDuration = duration / steps;

      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.value) {
          this.animatedValues[index] = stat.value;
          clearInterval(timer);
        } else {
          this.animatedValues[index] = Math.floor(current);
        }
      }, stepDuration);
    });
  }

  getAnimatedValue(index: number): string {
    const value = this.animatedValues[index] || 0;
    const stat = this.achievementsStats[index];
    return `${value}${stat.suffix}`;
  }

  getSafeInstagramUrl(url: string): SafeResourceUrl {
    if (!url) {
      // Return a safe empty URL if no embed URL is provided
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

    let embedUrl = url.trim();

    // If it already includes /embed/, use it as is
    if (embedUrl.includes('/embed/')) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    // Extract the post/reel ID from various URL formats
    let postId = '';

    if (embedUrl.includes('instagram.com/reel/')) {
      // Handle reel URLs: https://www.instagram.com/reel/DKizx6xttOw/?igsh=...
      const reelMatch = embedUrl.match(
        /instagram\.com\/reel\/([A-Za-z0-9_-]+)/
      );
      if (reelMatch && reelMatch[1]) {
        postId = reelMatch[1];
      }
    } else if (embedUrl.includes('instagram.com/p/')) {
      // Handle post URLs: https://www.instagram.com/p/ABC123XYZ/
      const postMatch = embedUrl.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/);
      if (postMatch && postMatch[1]) {
        postId = postMatch[1];
      }
    } else if (embedUrl.includes('instagram.com/')) {
      // Generic Instagram URL - try to extract ID
      const genericMatch = embedUrl.match(/\/([A-Za-z0-9_-]{11,})\/?/);
      if (genericMatch && genericMatch[1]) {
        postId = genericMatch[1];
      }
    } else {
      // Assume it's just the post/reel ID
      // Remove query parameters if any
      postId = embedUrl.split('?')[0].split('/').pop() || embedUrl;
    }

    if (postId) {
      // Convert to embed URL format
      embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
    } else {
      // Fallback: return empty if we can't parse
      return this.sanitizer.bypassSecurityTrustResourceUrl('');
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  getSafeYouTubeUrl(id: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}`
    );
  }

  openYouTube(): void {
    window.open('https://www.youtube.com/@tinyvividminds', '_blank');
  }

  bookDemo(): void {
    // Navigate tov contact page with demo booking fragment
    const element = document.getElementById('contact') || document.body;
    element.scrollIntoView({ behavior: 'smooth' });
  }
}
