import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface ExamSubmission {
  submissionId: number;
  studentId: number;
  studentName: string;
  courseId: number;
  courseName: string;
  fileName: string;
  fileUrl?: string;
  submittedOn: string;
  status: 'Pending' | 'Graded' | 'Approved' | 'Rejected';
  grade?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  remarks?: string;
}

@Component({
  selector: 'app-exam-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-management.component.html',
  styleUrls: ['./exam-management.component.css']
})
export class ExamManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  examSubmissions = signal<ExamSubmission[]>([]);
  assignments = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  selectedSubmission = signal<ExamSubmission | null>(null);
  showGradeModal = signal<boolean>(false);
  showViewModal = signal<boolean>(false);

  // Grade form
  grade = signal<number | null>(null);
  totalQuestions = signal<number | null>(null);
  correctAnswers = signal<number | null>(null);
  wrongAnswers = signal<number | null>(null);
  remarks = signal<string>('');

  ngOnInit(): void {
    this.loadExamSubmissions();
  }

  loadExamSubmissions(): void {
    this.isLoading.set(true);

    this.apiService.getTeacherExamSubmissions().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        const submissions: ExamSubmission[] = Array.isArray(data) ? data.map((item: any) => ({
          submissionId: item.submissionId,
          studentId: item.studentId,
          studentName: item.studentName,
          courseId: item.courseId,
          courseName: item.courseName,
          fileName: item.fileName,
          fileUrl: item.fileUrl,
          submittedOn: item.submittedOn,
          status: item.status,
          grade: item.grade,
          totalQuestions: item.totalQuestions,
          correctAnswers: item.correctAnswers,
          wrongAnswers: item.wrongAnswers,
          remarks: item.remarks
        })) : [];

        this.examSubmissions.set(submissions);
        this.isLoading.set(false);
      }, () => {
        this.examSubmissions.set([]);
        this.isLoading.set(false);
      })
    );
  }

  viewFile(submission: ExamSubmission): void {
    this.selectedSubmission.set(submission);
    this.showViewModal.set(true);

    // Open the actual file using the file serving endpoint
    if (submission.fileUrl) {
      const fileUrl = this.apiService.getFileUrl(submission.fileUrl);
      window.open(fileUrl, '_blank');
    } else {
      this.loggingService.onError('File not available');
    }
  }

  openGradeModal(submission: ExamSubmission): void {
    this.selectedSubmission.set(submission);
    this.grade.set(submission.grade || null);
    this.totalQuestions.set(submission.totalQuestions || null);
    this.correctAnswers.set(submission.correctAnswers || null);
    this.wrongAnswers.set(submission.wrongAnswers || null);
    this.remarks.set(submission.remarks || '');
    this.showGradeModal.set(true);
  }

  closeGradeModal(): void {
    this.showGradeModal.set(false);
    this.selectedSubmission.set(null);
    this.grade.set(null);
    this.totalQuestions.set(null);
    this.correctAnswers.set(null);
    this.wrongAnswers.set(null);
    this.remarks.set('');
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedSubmission.set(null);
  }

  submitGrade(): void {
    const submission = this.selectedSubmission();
    const gradeValue = this.grade();
    const totalQuestionsValue = this.totalQuestions();
    const correctAnswersValue = this.correctAnswers();
    const wrongAnswersValue = this.wrongAnswers();
    const remarksValue = this.remarks().trim();

    if (!submission) return;

    if (gradeValue === null || gradeValue < 0 || gradeValue > 100) {
      this.loggingService.onError('Please enter a valid grade (0-100)');
      return;
    }

    if (totalQuestionsValue !== null && totalQuestionsValue <= 0) {
      this.loggingService.onError('Total questions must be greater than 0');
      return;
    }

    if (correctAnswersValue !== null && correctAnswersValue < 0) {
      this.loggingService.onError('Correct answers cannot be negative');
      return;
    }

    if (wrongAnswersValue !== null && wrongAnswersValue < 0) {
      this.loggingService.onError('Wrong answers cannot be negative');
      return;
    }

    const gradeData = {
      grade: gradeValue,
      totalQuestions: totalQuestionsValue,
      correctAnswers: correctAnswersValue,
      wrongAnswers: wrongAnswersValue,
      remarks: remarksValue,
      status: 'Graded'
    };

    this.apiService.gradeExamSubmission(submission.submissionId, gradeData).subscribe(
      handleResponse(this.loggingService, (updatedSubmission: any) => {
        // Update the local submissions list
        this.examSubmissions.update(submissions =>
          submissions.map(s =>
            s.submissionId === submission.submissionId
              ? {
                  ...s,
                  grade: updatedSubmission.grade,
                  totalQuestions: updatedSubmission.totalQuestions,
                  correctAnswers: updatedSubmission.correctAnswers,
                  wrongAnswers: updatedSubmission.wrongAnswers,
                  remarks: updatedSubmission.remarks,
                  status: updatedSubmission.status
                }
              : s
          )
        );

        this.loggingService.onSuccess('Grade submitted successfully!');
        this.closeGradeModal();
      })
    );
  }

  approveSubmission(submission: ExamSubmission): void {
    this.apiService.updateExamSubmissionStatus(submission.submissionId, 'Approved').subscribe(
      handleResponse(this.loggingService, (updatedSubmission: any) => {
        this.examSubmissions.update(submissions =>
          submissions.map(s =>
            s.submissionId === submission.submissionId
              ? { ...s, status: updatedSubmission.status }
              : s
          )
        );
        this.loggingService.onSuccess('Submission approved successfully!');
      })
    );
  }

  rejectSubmission(submission: ExamSubmission): void {
    if (confirm('Are you sure you want to reject this submission?')) {
      this.apiService.updateExamSubmissionStatus(submission.submissionId, 'Rejected').subscribe(
        handleResponse(this.loggingService, (updatedSubmission: any) => {
          this.examSubmissions.update(submissions =>
            submissions.map(s =>
              s.submissionId === submission.submissionId
                ? { ...s, status: updatedSubmission.status }
                : s
            )
          );
          this.loggingService.onSuccess('Submission rejected');
        })
      );
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Graded':
        return 'status-graded';
      case 'Pending':
        return 'status-pending';
      case 'Rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'fas fa-file-pdf';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'fas fa-file-image';
      default:
        return 'fas fa-file';
    }
  }

  onGradeChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    if (numValue !== null && !isNaN(numValue)) {
      this.grade.set(numValue);
    } else {
      this.grade.set(null);
    }
  }

  onTotalQuestionsChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    if (numValue !== null && !isNaN(numValue)) {
      this.totalQuestions.set(numValue);
    } else {
      this.totalQuestions.set(null);
    }
  }

  onCorrectAnswersChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    if (numValue !== null && !isNaN(numValue)) {
      this.correctAnswers.set(numValue);
    } else {
      this.correctAnswers.set(null);
    }
  }

  onWrongAnswersChange(value: string): void {
    const numValue = value ? parseInt(value, 10) : null;
    if (numValue !== null && !isNaN(numValue)) {
      this.wrongAnswers.set(numValue);
    } else {
      this.wrongAnswers.set(null);
    }
  }

  onRemarksChange(value: string): void {
    this.remarks.set(value);
  }
}

