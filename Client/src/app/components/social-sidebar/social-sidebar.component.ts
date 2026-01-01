import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-sidebar.component.html',
  styleUrls: ['./social-sidebar.component.css'],
})
export class SocialSidebarComponent {
  showModal = false;

  socialLinks = [
    {
      name: 'Facebook',
      icon: 'fab fa-facebook-f',
      url: 'https://facebook.com/tinyvividminds',
      color: '#1877f2',
      hoverColor: '#166fe5',
    },
    {
      name: 'WhatsApp',
      icon: 'fab fa-whatsapp',
      url: 'https://wa.me/1234567890',
      color: '#25d366',
      hoverColor: '#20ba5a',
    },
    {
      name: 'Instagram',
      icon: 'fab fa-instagram',
      url: 'https://www.instagram.com/tiny_vivid_minds',
      color: '#e4405f',
      hoverColor: '#c13584',
    },
  ];

  additionalSocialLinks = [
    {
      name: 'YouTube',
      icon: 'fab fa-youtube',
      url: 'https://youtube.com/@tinyvividminds',
      color: '#ff0000',
      hoverColor: '#cc0000',
    },
    {
      name: 'Telegram',
      icon: 'fab fa-telegram-plane',
      url: 'https://t.me/tinyvividminds',
      color: '#0088cc',
      hoverColor: '#006699',
    },
    {
      name: 'LinkedIn',
      icon: 'fab fa-linkedin-in',
      url: 'https://linkedin.com/company/tinyvividminds',
      color: '#0077b5',
      hoverColor: '#005885',
    },
    {
      name: 'Gmail',
      icon: 'fab fa-google',
      url: 'mailto:info@tinyvividminds.com',
      color: '#ea4335',
      hoverColor: '#d33b2c',
    },
    {
      name: 'Twitter',
      icon: 'fab fa-twitter',
      url: 'https://twitter.com/tinyvividminds',
      color: '#1da1f2',
      hoverColor: '#0d8bd9',
    },
    
    {
      name: 'TikTok',
      icon: 'fab fa-tiktok',
      url: 'https://tiktok.com/@tinyvividminds',
      color: '#000000',
      hoverColor: '#333333',
    },
    
  ];

  openSocialLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  toggleModal(): void {
    this.showModal = !this.showModal;
  }

  closeModal(): void {
    this.showModal = false;
  }

  openAdditionalSocialLink(url: string): void {
    this.openSocialLink(url);
    this.closeModal();
  }
}
