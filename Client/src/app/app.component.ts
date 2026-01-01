import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Tiny Vivid Minds';
  private router = inject(Router);
  private subscription?: Subscription;
  
  // Internal routes that should not show header/footer
  private internalRoutes = ['/admin', '/teacher', '/student', '/auth/login', '/auth/register'];
  
  // Signal to track current URL
  private currentUrl = signal<string>(this.router.url);
  
  // Check if current route is internal
  isInternalRoute = computed(() => {
    const url = this.currentUrl();
    return this.internalRoutes.some(route => url.startsWith(route));
  });
  
  ngOnInit() {
    // Set initial URL
    this.currentUrl.set(this.router.url);
    
    // Subscribe to route changes to update the signal
    this.subscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.url);
      });
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
