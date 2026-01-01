import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface Certificate {
  certificateId: number;
  courseId: number;
  courseName: string;
  issuedDate: string;
  verificationCode?: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css']
})
export class CertificatesComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  certificates = signal<Certificate[]>([]);
  isLoading = signal<boolean>(true);
  showVerificationCode = signal<Map<number, boolean>>(new Map());

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates(): void {
    this.isLoading.set(true);
    
    // Load certificates from API
    this.apiService.getMyCertificates().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        const certificatesList = Array.isArray(data) ? data : [];
        this.certificates.set(
          certificatesList.map((cert: any) => ({
            certificateId: cert.certificateId,
            courseId: cert.courseId,
            courseName: cert.courseName || 'Unknown Course',
            issuedDate: cert.issuedDate,
            verificationCode: cert.verificationCode,
            downloadUrl: cert.downloadUrl
          }))
        );
        this.isLoading.set(false);
      }, () => {
        this.certificates.set([]);
        this.isLoading.set(false);
      })
    );
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).replace(/\s/g, '-');
    } catch {
      return dateString;
    }
  }

  downloadCertificate(certificate: Certificate): void {
    if (certificate.downloadUrl) {
      // Create a download link
      const link = document.createElement('a');
      link.href = certificate.downloadUrl;
      link.download = `${certificate.courseName}_Certificate.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.loggingService.onSuccess('Certificate download started!');
    } else {
      this.loggingService.onError('Download URL not available for this certificate');
    }
  }

  toggleVerificationCode(certificateId: number): void {
    const current = this.showVerificationCode();
    const newMap = new Map(current);
    newMap.set(certificateId, !newMap.get(certificateId));
    this.showVerificationCode.set(newMap);
  }

  getVerificationCode(certificateId: number): string {
    const cert = this.certificates().find(c => c.certificateId === certificateId);
    return cert?.verificationCode || '';
  }

  isVerificationCodeVisible(certificateId: number): boolean {
    return this.showVerificationCode().get(certificateId) || false;
  }

  copyVerificationCode(certificateId: number): void {
    const code = this.getVerificationCode(certificateId);
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.loggingService.onSuccess('Verification code copied to clipboard!');
      }).catch(() => {
        this.loggingService.onError('Failed to copy verification code');
      });
    }
  }
}

