import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface Course {
  courseId: number;
  courseName: string;
  isCompleted?: boolean;
  completionPercentage?: number;
}

interface ExamSubmission {
  submissionId: number;
  courseId: number;
  courseName: string;
  fileName: string;
  fileUrl: string;
  submittedNotes?: string;
  status: 'Pending' | 'Graded' | 'Approved' | 'Rejected';
  grade?: number;
  remarks?: string;
  submittedOn: string;
  updatedAt?: string;
  gradedAt?: string;
}

@Component({
  selector: 'app-exam-submission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-submission.component.html',
  styleUrls: ['./exam-submission.component.css']
})
export class ExamSubmissionComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  courses = signal<Course[]>([]);
  selectedCourseId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  notes = signal<string>('');
  isLoadingCourses = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isLoadingSubmissions = signal<boolean>(false);

  // Previous submissions
  submissions = signal<ExamSubmission[]>([]);
  selectedCourseFilter = signal<number | null>(null);
  showSubmissions = signal<boolean>(true);

  // Feature flag - enable/disable course completion requirement
  // Set to true to require course completion before exam upload
  // Set to false to allow exam upload for any enrolled course
  requireCourseCompletion = signal<boolean>(true);

  // Validation
  fileError = signal<string>('');
  courseError = signal<string>('');

  // File validation constants
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  readonly ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  readonly ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

  ngOnInit(): void {
    this.loadCourses();
    this.loadSubmissions();
  }

  loadCourses(): void {
    this.isLoadingCourses.set(true);
    this.apiService.getMyCourses().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        let coursesList = Array.isArray(data) ? data : [];

        // If course completion is required, filter only completed courses
        if (this.requireCourseCompletion()) {
          coursesList = coursesList.filter((course: any) => {
            // Check if course status is 'completed' or if all levels are completed
            const status = course.status?.toLowerCase();
            return status === 'completed' ||
                   (course.completedLevels && course.totalLevels &&
                    course.completedLevels >= course.totalLevels);
          });
        }

        this.courses.set(coursesList.map((course: any) => ({
          courseId: course.courseId,
          courseName: course.courseName || course.name || 'Unknown Course',
          isCompleted: course.status?.toLowerCase() === 'completed' ||
                      (course.completedLevels && course.totalLevels &&
                       course.completedLevels >= course.totalLevels),
          completionPercentage: course.levelProgress || 0
        })));

        this.isLoadingCourses.set(false);
      }, () => {
        this.courses.set([]);
        this.isLoadingCourses.set(false);
      })
    );
  }

  onCourseChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const courseId = selectElement.value ? parseInt(selectElement.value) : null;
    this.selectedCourseId.set(courseId);
    this.courseError.set('');
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    
    if (!file) {
      this.selectedFile.set(null);
      this.fileError.set('');
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = this.ALLOWED_EXTENSIONS.includes(fileExtension) || 
                        this.ALLOWED_TYPES.includes(file.type);

    if (!isValidType) {
      this.fileError.set('Only PDF, PNG, and JPG formats are allowed.');
      this.selectedFile.set(null);
      inputElement.value = '';
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.fileError.set('File size must be less than 10 MB.');
      this.selectedFile.set(null);
      inputElement.value = '';
      return;
    }

    // File is valid
    this.selectedFile.set(file);
    this.fileError.set('');
  }

  onNotesChange(event: Event): void {
    const textareaElement = event.target as HTMLTextAreaElement;
    this.notes.set(textareaElement.value);
  }

  getFileName(): string {
    const file = this.selectedFile();
    return file ? file.name : 'No file chosen';
  }

  getFileSize(): string {
    const file = this.selectedFile();
    if (!file) return '';
    
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return `${sizeInMB} MB`;
  }

  validateForm(): boolean {
    let isValid = true;

    // Validate course selection
    if (!this.selectedCourseId()) {
      this.courseError.set('Please select a course.');
      isValid = false;
    } else {
      this.courseError.set('');
    }

    // Validate file
    if (!this.selectedFile()) {
      this.fileError.set('Please select a file to upload.');
      isValid = false;
    } else {
      this.fileError.set('');
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting.set(true);

    const file = this.selectedFile();
    const courseId = this.selectedCourseId();

    if (file && courseId) {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId.toString());
      if (this.notes().trim()) {
        formData.append('submittedNotes', this.notes().trim());
      }

      this.apiService.createExamSubmission(formData).subscribe(
        handleResponse(this.loggingService, (data: any) => {
          this.loggingService.onSuccess('Exam paper submitted successfully!');
          this.resetForm();
          this.isSubmitting.set(false);
          this.loadSubmissions(); // Reload submissions
        }, () => {
          this.isSubmitting.set(false);
        })
      );
    }
  }

  loadSubmissions(): void {
    this.isLoadingSubmissions.set(true);
    const courseId = this.selectedCourseFilter();
    
    const request = courseId 
      ? this.apiService.getMyExamSubmissionsByCourse(courseId)
      : this.apiService.getMyExamSubmissions();

    request.subscribe(
      handleResponse(this.loggingService, (data: any) => {
        const submissionsList = Array.isArray(data) ? data : [];
        this.submissions.set(submissionsList);
        this.isLoadingSubmissions.set(false);
      }, () => {
        this.submissions.set([]);
        this.isLoadingSubmissions.set(false);
      })
    );
  }

  onCourseFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const courseId = selectElement.value ? parseInt(selectElement.value) : null;
    this.selectedCourseFilter.set(courseId);
    this.loadSubmissions();
  }

  viewFile(submission: ExamSubmission): void {
    if (submission.fileUrl) {
      const fileUrl = this.apiService.getFileUrl(submission.fileUrl);
      window.open(fileUrl, '_blank');
    }
  }

  deleteSubmission(submissionId: number): void {
    if (confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      this.apiService.deleteExamSubmission(submissionId).subscribe(
        handleResponse(this.loggingService, () => {
          this.loggingService.onSuccess('Submission deleted successfully!');
          this.loadSubmissions();
        })
      );
    }
  }

  canDelete(submission: ExamSubmission): boolean {
    return submission.status === 'Pending';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Graded':
        return 'status-graded';
      case 'Rejected':
        return 'status-rejected';
      case 'Pending':
      default:
        return 'status-pending';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  resetForm(): void {
    this.selectedCourseId.set(null);
    this.selectedFile.set(null);
    this.notes.set('');
    this.fileError.set('');
    this.courseError.set('');

    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Method to toggle course completion requirement (for admin use)
  toggleCourseCompletionRequirement(): void {
    const currentValue = this.requireCourseCompletion();
    this.requireCourseCompletion.set(!currentValue);
    this.loadCourses(); // Reload courses with new setting

    this.loggingService.onSuccess(
      `Course completion requirement ${!currentValue ? 'enabled' : 'disabled'}`
    );
  }

  // Getter for template access
  isCourseCompletionRequired(): boolean {
    return this.requireCourseCompletion();
  }
}

