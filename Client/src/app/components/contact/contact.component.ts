import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { DemoBooking } from '../../models/demo-booking.model';
import { Contact } from '../../models/contact.model';
import { JoinUs } from '../../models/join-us.model';
import { Feedback } from '../../models/feedback.model';
import { SocialSidebarComponent } from '../social-sidebar/social-sidebar.component';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SocialSidebarComponent, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  demoForm: FormGroup;
  contactForm: FormGroup;
  joinUsForm: FormGroup;
  feedbackForm: FormGroup;

  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  successMessage = '';
  errorMessage = '';
  
  isSubmittingFeedback = false;
  feedbackSubmitSuccess = false;
  feedbackSubmitError = false;
  
  activeFaqIndex: number | null = null;
  
  stars = [1, 2, 3, 4, 5];

  // ECharts world map options
  chartOptions: any;
  echartsInstance: any;
  private mapLoaded = false;

  // Animated stats
  animatedStudentCount = 0;
  isStudentCountAnimated = false;

  constructor() {
    // Demo Booking Form
    this.demoForm = this.fb.group({
      parentName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^[\+]?[0-9][\d]{0,15}$/)],
      ],
      childName: ['', [Validators.required, Validators.minLength(2)]],
      childAge: [
        null,
        [
          Validators.required,
          this.ageValidator.bind(this),
        ],
      ],
      preferredCourse: ['', [Validators.required]],
      preferredDate: ['', [Validators.required]],
      preferredTime: ['', [Validators.required]],
      message: [''],
    });

    // Contact Form
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9][\d\s\-\(\)]{0,15}$/)]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      newsletter: [false],
    });

    // Join Us Form
    this.joinUsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)],
      ],
      qualification: ['', [Validators.required, Validators.minLength(5)]],
      experience: ['', [Validators.required, Validators.minLength(5)]],
      preferredSubject: ['', [Validators.required]],
      availability: ['', [Validators.required, Validators.minLength(10)]],
      message: [''],
    });

    // Feedback Form
    this.feedbackForm = this.fb.group({
      parentName: ['', [Validators.required, Validators.minLength(2)]],
      childName: ['', [Validators.required, Validators.minLength(2)]],
      course: ['', [Validators.required]],
      rating: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.initScrollAnimations();
    // Load map first, then initialize chart
    this.loadWorldMapAndInit();
    this.initCountUpAnimation();
  }

  private loadWorldMapAndInit(): void {
    // Load world map GeoJSON first, then initialize chart
    const geojsonUrl = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

    this.http.get(geojsonUrl).subscribe({
      next: (data: any) => {
        if (data && data.type === 'FeatureCollection') {
          try {
            echarts.registerMap('world', data);
            this.mapLoaded = true;
            // Now initialize the chart with the map
            this.initWorldMap();
          } catch (error) {
            console.log('Error registering map:', error);
            // Initialize without map if registration fails - use simple scatter
            this.initWorldMapWithoutMap();
          }
        } else {
          // Initialize without map if data is invalid
          this.initWorldMapWithoutMap();
        }
      },
      error: (error) => {
        // If map fails to load, still show chart without map boundaries
        console.log('World map boundaries not loaded, showing locations without map');
        this.mapLoaded = false;
        this.initWorldMapWithoutMap();
      }
    });
  }

  private initWorldMapWithoutMap(): void {
    // Fallback: show locations without geo map - use simple scatter with geographic projection
    const locations = [
      { name: 'India 🇮🇳', value: [77.2090, 28.6139], symbolSize: 20 },
      { name: 'UAE 🇦🇪', value: [54.3773, 24.4539], symbolSize: 20 },
      { name: 'UK 🇬🇧', value: [-0.1276, 51.5074], symbolSize: 20 },
      { name: 'USA 🇺🇸', value: [-74.0060, 40.7128], symbolSize: 20 },
      { name: 'Australia 🇦🇺', value: [151.2093, -33.8688], symbolSize: 20 },
    ];

    this.chartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          const name = Array.isArray(data) ? data[2] : data.name || 'Location';
          const lng = Array.isArray(data) ? data[0] : (data.value ? data.value[0] : data[0]);
          const lat = Array.isArray(data) ? data[1] : (data.value ? data.value[1] : data[1]);
          return `<div style="padding: 8px;">
            <strong>${name}</strong><br/>
            <small>Location: [${lng}, ${lat}]</small>
          </div>`;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#6366f1',
        borderWidth: 1,
        textStyle: {
          color: '#333',
        },
      },
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: [{
        type: 'value',
        min: -180,
        max: 180,
        show: false,
      }],
      yAxis: [{
        type: 'value',
        min: -90,
        max: 90,
        show: false,
      }],
      series: [{
        name: 'Our Locations',
        type: 'scatter',
        data: locations.map(loc => [loc.value[0], loc.value[1], loc.name]),
        symbolSize: 20,
        itemStyle: {
          color: '#6366f1',
          shadowBlur: 10,
          shadowColor: 'rgba(99, 102, 241, 0.5)',
        },
        label: {
          show: true,
          position: 'bottom',
          formatter: (params: any) => {
            return params.data[2]; // Use the name from the data array
          },
          fontSize: 12,
          fontWeight: 'bold',
          color: '#6366f1',
          offset: [0, 5],
        },
        emphasis: {
          itemStyle: {
            color: '#4f46e5',
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 15,
            shadowColor: 'rgba(99, 102, 241, 0.8)',
          },
        },
      }],
    };
  }

  private updateChartWithMap(): void {
    if (this.mapLoaded && this.echartsInstance && this.chartOptions) {
      // Update chart options with map after it's loaded
      setTimeout(() => {
        if (this.echartsInstance && this.chartOptions) {
          // Add geo component with map
          this.chartOptions.geo = {
            map: 'world',
            roam: true,
            zoom: 1.5,
            center: [20, 0],
            label: {
              show: false,
            },
            itemStyle: {
              areaColor: '#e3f2fd',
              borderColor: '#1976d2',
              borderWidth: 0.5,
            },
            emphasis: {
              itemStyle: {
                areaColor: '#bbdefb',
              },
            },
            silent: false,
            show: true,
          };
          // Update series to use geo coordinate system
          if (this.chartOptions.series && this.chartOptions.series[0]) {
            this.chartOptions.series[0].coordinateSystem = 'geo';
          }
          // Use setTimeout to ensure we're not in main process
          setTimeout(() => {
            if (this.echartsInstance && this.chartOptions) {
              this.echartsInstance.setOption(this.chartOptions, { notMerge: true, lazyUpdate: true });
            }
          }, 0);
        }
      }, 200);
    }
  }

  initWorldMap(): void {
    // Define 5 locations with their coordinates [longitude, latitude]
    const locations = [
      { name: 'India 🇮🇳', value: [77.2090, 28.6139], symbolSize: 20 }, // New Delhi
      { name: 'UAE 🇦🇪', value: [54.3773, 24.4539], symbolSize: 20 }, // Dubai
      { name: 'UK 🇬🇧', value: [-0.1276, 51.5074], symbolSize: 20 }, // London
      { name: 'USA 🇺🇸', value: [-74.0060, 40.7128], symbolSize: 20 }, // New York
      { name: 'Australia 🇦🇺', value: [151.2093, -33.8688], symbolSize: 20 }, // Sydney
    ];

    this.chartOptions = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'scatter') {
            return `<div style="padding: 8px;">
              <strong>${params.data.name}</strong><br/>
              <small>Location: [${params.data.value[0]}, ${params.data.value[1]}]</small>
            </div>`;
          }
          return params.name;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#6366f1',
        borderWidth: 1,
        textStyle: {
          color: '#333',
        },
      },
      // Geo component will be added when map is loaded
      series: [
        {
          name: 'Our Locations',
          type: 'scatter',
          // Use cartesian coordinates initially, will switch to geo when map loads
          data: locations.map(loc => ({
            ...loc,
            value: [loc.value[0], loc.value[1]] // Keep as [lng, lat] for when geo is added
          })),
          symbolSize: (value: any, params: any) => {
            return params.data.symbolSize;
          },
          symbol: 'circle',
          itemStyle: {
            color: '#6366f1',
            shadowBlur: 10,
            shadowColor: 'rgba(99, 102, 241, 0.5)',
          },
          label: {
            show: true,
            position: 'bottom',
            formatter: (params: any) => {
              return params.data.name;
            },
            fontSize: 12,
            fontWeight: 'bold',
            color: '#6366f1',
            offset: [0, 5],
          },
          emphasis: {
            itemStyle: {
              color: '#4f46e5',
              borderColor: '#fff',
              borderWidth: 3,
              shadowBlur: 15,
              shadowColor: 'rgba(99, 102, 241, 0.8)',
            },
            label: {
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
        },
      ],
    };
  }

  onChartInit(echartsInstance: any): void {
    this.echartsInstance = echartsInstance;
    // Wait for chart to be fully ready before setting options
    // This prevents "setOption should not be called during main process" error
    if (this.chartOptions) {
      // Use setTimeout to defer until after initialization is complete
      setTimeout(() => {
        if (this.echartsInstance && this.chartOptions) {
          this.echartsInstance.setOption(this.chartOptions, { notMerge: false, lazyUpdate: true });
        }
      }, 0);
    }
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

  onDemoSubmit(): void {
    if (this.demoForm.valid) {
      this.isSubmitting = true;
      this.resetMessages();

      const demoData: DemoBooking = {
        ...this.demoForm.value,
        status: 'PENDING',
      };

      this.apiService.bookDemo(demoData).subscribe({
        next: (response: any) => {
          console.log('Demo booking submitted successfully:', response);
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.successMessage =
            'Demo booking submitted successfully! We will contact you soon to confirm the schedule.';
          this.demoForm.reset();
        },
        error: (error: any) => {
          console.error('Error submitting demo booking:', error);
          this.isSubmitting = false;
          this.submitError = true;
          this.errorMessage =
            'There was an error submitting your demo booking. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.demoForm);
    }
  }

  onContactSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting = true;
      this.resetMessages();

      const contactData: Contact = {
        ...this.contactForm.value,
        status: 'NEW',
      };

      this.apiService.createContact(contactData).subscribe({
        next: (response: any) => {
          console.log('Contact form submitted successfully:', response);
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.successMessage =
            'Message sent successfully! We will get back to you within 24 hours.';
          this.contactForm.reset();
        },
        error: (error: any) => {
          console.error('Error submitting contact form:', error);
          this.isSubmitting = false;
          this.submitError = true;
          this.errorMessage =
            'There was an error sending your message. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.contactForm);
    }
  }

  onJoinUsSubmit(): void {
    if (this.joinUsForm.valid) {
      this.isSubmitting = true;
      this.resetMessages();

      const joinUsData: JoinUs = {
        ...this.joinUsForm.value,
        status: 'PENDING',
      };

      this.apiService.joinUs(joinUsData).subscribe({
        next: (response: any) => {
          console.log('Join us application submitted successfully:', response);
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.successMessage =
            'Application submitted successfully! We will review your application and contact you soon.';
          this.joinUsForm.reset();
        },
        error: (error: any) => {
          console.error('Error submitting join us application:', error);
          this.isSubmitting = false;
          this.submitError = true;
          this.errorMessage =
            'There was an error submitting your application. Please try again.';
        },
      });
    } else {
      this.markFormGroupTouched(this.joinUsForm);
    }
  }

  setRating(rating: number): void {
    this.feedbackForm.patchValue({ rating });
  }

  onFeedbackSubmit(): void {
    if (this.feedbackForm.valid) {
      this.isSubmittingFeedback = true;
      this.feedbackSubmitSuccess = false;
      this.feedbackSubmitError = false;

      const feedbackData: Feedback = {
        name: this.feedbackForm.value.parentName,
        email: this.feedbackForm.value.email,
        rating: this.feedbackForm.value.rating,
        message: this.feedbackForm.value.message,
        childName: this.feedbackForm.value.childName,
        course: this.feedbackForm.value.course,
      };

      this.apiService.createFeedback(feedbackData).subscribe({
        next: (response: any) => {
          console.log('Feedback submitted successfully:', response);
          this.isSubmittingFeedback = false;
          this.feedbackSubmitSuccess = true;
          this.feedbackForm.reset();
        },
        error: (error: any) => {
          console.error('Error submitting feedback:', error);
          this.isSubmittingFeedback = false;
          this.feedbackSubmitError = true;
        },
      });
    } else {
      this.markFormGroupTouched(this.feedbackForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private resetMessages(): void {
    this.submitSuccess = false;
    this.submitError = false;
    this.successMessage = '';
    this.errorMessage = '';
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

  private initCountUpAnimation(): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const statCards = document.querySelectorAll('.stat-card');
      
      if (statCards.length > 0) {
        // Find the first stat card (Students Learning Globally)
        const studentStatCard = statCards[0];
        
        if (studentStatCard) {
          const countObserver = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting && !this.isStudentCountAnimated) {
                  this.isStudentCountAnimated = true;
                  this.animateStudentCount();
                  countObserver.unobserve(entry.target);
                }
              });
            },
            {
              threshold: 0.5,
              rootMargin: '0px',
            }
          );

          countObserver.observe(studentStatCard);
        }
      }
    }, 100);
  }

  private animateStudentCount(): void {
    const targetCount = 200;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetCount / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      this.animatedStudentCount = Math.min(
        Math.floor(increment * currentStep),
        targetCount
      );

      if (currentStep >= steps) {
        this.animatedStudentCount = targetCount;
        clearInterval(timer);
      }
    }, stepDuration);
  }

  private ageValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return { required: true };
    }
    const age = Number(control.value);
    if (isNaN(age)) {
      return { invalidAge: true };
    }
    if (age < 4 || age > 14) {
      return { ageRange: true };
    }
    return null;
  }
}
