import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LoggingService } from '../../services/logging.service';
import { handleResponse } from '../../utils/handle-response.utils';

interface Course {
  courseId: number;
  courseName: string;
  description: string;
  createdBy?: number;
  createdAt?: string;
  levels?: CourseLevel[];
}

interface CourseLevel {
  levelId?: number;
  courseId: number;
  levelNumber: number;
  levelName: string;
  objectives: string;
  durationWeeks: number;
}

@Component({
  selector: 'app-manage-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manage-courses.component.html',
  styleUrls: ['./manage-courses.component.css']
})
export class ManageCoursesComponent implements OnInit {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);
  private fb = inject(FormBuilder);

  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(false);

  // Modal states
  showCourseModal = signal<boolean>(false);
  showCourseViewModal = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  selectedCourse = signal<Course | null>(null);
  selectedCourseForView = signal<Course | null>(null);

  // Accordion states for levels
  expandedCourses = signal<Set<number>>(new Set());
  showLevelForm = signal<Map<number, boolean>>(new Map());
  editingLevel = signal<CourseLevel | null>(null);

  // Course Form
  courseForm: FormGroup = this.fb.group({
    courseName: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(50)]],
    targetAgeGroup: [''],
    mode: ['Online']
  });

  // Level Form
  levelForm: FormGroup = this.fb.group({
    levelNumber: [1, [Validators.required, Validators.min(1), Validators.max(100)]], // 1-6 or custom (up to 100)
    levelName: ['', [Validators.required]],
    objectives: ['', [Validators.required]],
    durationWeeks: [4, [Validators.required, Validators.min(1)]]
  });

  ngOnInit() {
    this.fetchCourses();
  }

  fetchCourses() {
    this.isLoading.set(true);
    this.apiService.getAllCourses().subscribe(
      handleResponse(this.loggingService, (data: any) => {
        const courses = Array.isArray(data) ? data : [];
        // Fetch levels for each course
        const coursesWithLevels = courses.map((course: Course) => ({
          ...course,
          levels: []
        }));
        this.courses.set(coursesWithLevels);
        
        // Load levels for each course
        coursesWithLevels.forEach((course: Course) => {
          this.loadLevelsForCourse(course.courseId);
        });
        
        this.isLoading.set(false);
      }, () => {
        this.isLoading.set(false);
      })
    );
  }

  loadLevelsForCourse(courseId: number) {
    this.apiService.getLevelsByCourse(courseId).subscribe(
      handleResponse(this.loggingService, (data: any) => {
        const levels = Array.isArray(data) ? data : [];
        this.courses.update(courses => 
          courses.map(course => 
            course.courseId === courseId 
              ? { ...course, levels } 
              : course
          )
        );
      })
    );
  }

  toggleAccordion(courseId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const course = this.courses().find(c => c.courseId === courseId);
    if (!course) return;

    const currentExpanded = this.expandedCourses();
    const newExpanded = new Set(currentExpanded);

    if (newExpanded.has(courseId)) {
      // Collapse - close any open forms
      this.closeLevelForm(courseId);
      newExpanded.delete(courseId);
    } else {
      // Expand - load levels if not already loaded
      if (!course.levels || course.levels.length === 0) {
        this.loadLevelsForCourse(courseId);
      }
      newExpanded.add(courseId);
    }

    this.expandedCourses.set(newExpanded);
  }

  isExpanded(courseId: number): boolean {
    return this.expandedCourses().has(courseId);
  }

  openCourseModal(course?: Course, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (course) {
      this.isEditMode.set(true);
      this.selectedCourse.set(course);
      this.courseForm.patchValue({
        courseName: course.courseName,
        description: course.description,
        targetAgeGroup: '',
        mode: 'Online'
      });
    } else {
      this.isEditMode.set(false);
      this.selectedCourse.set(null);
      this.courseForm.reset({
        courseName: '',
        description: '',
        targetAgeGroup: '',
        mode: 'Online'
      });
    }
    this.showCourseModal.set(true);
  }

  closeCourseModal() {
    this.showCourseModal.set(false);
    this.isEditMode.set(false);
    this.selectedCourse.set(null);
    this.courseForm.reset();
  }

  openCourseViewModal(course: Course, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.selectedCourseForView.set(course);
    // Load levels if not already loaded
    if (!course.levels || course.levels.length === 0) {
      this.loadLevelsForCourse(course.courseId);
    }
    this.showCourseViewModal.set(true);
  }

  closeCourseViewModal() {
    this.showCourseViewModal.set(false);
    this.selectedCourseForView.set(null);
  }

  onSubmitCourse() {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    const courseName = this.courseForm.value.courseName.trim();
    
    // Check for duplicate course name (case-insensitive)
    if (!this.isEditMode()) {
      const isDuplicate = this.courses().some(course => 
        course.courseName.toLowerCase() === courseName.toLowerCase()
      );
      
      if (isDuplicate) {
        this.loggingService.onError('Course name must be unique. A course with this name already exists.');
        this.courseForm.get('courseName')?.setErrors({ duplicate: true });
        return;
      }
    } else {
      // For edit mode, check if name changed and if new name is duplicate
      const selectedCourse = this.selectedCourse();
      if (selectedCourse && selectedCourse.courseName.toLowerCase() !== courseName.toLowerCase()) {
        const isDuplicate = this.courses().some(course => 
          course.courseId !== selectedCourse.courseId &&
          course.courseName.toLowerCase() === courseName.toLowerCase()
        );
        
        if (isDuplicate) {
          this.loggingService.onError('Course name must be unique. A course with this name already exists.');
          this.courseForm.get('courseName')?.setErrors({ duplicate: true });
          return;
        }
      }
    }

    const courseData = {
      courseName: courseName,
      description: this.courseForm.value.description.trim(),
      targetAgeGroup: this.courseForm.value.targetAgeGroup?.trim() || null,
      mode: 'Online'
    };

    if (this.isEditMode() && this.selectedCourse()) {
      // Update course
      this.apiService.updateCourse(this.selectedCourse()!.courseId, courseData).subscribe(
        handleResponse(this.loggingService, (data: any) => {
          this.loggingService.onSuccess('Course updated successfully!');
          this.closeCourseModal();
          this.fetchCourses();
        })
      );
    } else {
      // Create course
      this.apiService.createCourse(courseData).subscribe(
        handleResponse(this.loggingService, (data: any) => {
          this.loggingService.onSuccess('Course created successfully!');
          this.closeCourseModal();
          this.fetchCourses();
        })
      );
    }
  }

  deleteCourse(courseId: number) {
    if (confirm('Are you sure you want to delete this course? This will also delete all associated levels.')) {
      this.apiService.deleteCourse(courseId).subscribe(
        handleResponse(this.loggingService, () => {
          this.loggingService.onSuccess('Course deleted successfully!');
          this.fetchCourses();
        })
      );
    }
  }

  openLevelForm(courseId: number, level?: CourseLevel) {
    const showForm = new Map(this.showLevelForm());

    if (level) {
      this.editingLevel.set(level);
      this.levelForm.patchValue({
        levelNumber: level.levelNumber,
        levelName: level.levelName,
        objectives: level.objectives,
        durationWeeks: level.durationWeeks
      });
    } else {
      this.editingLevel.set(null);
      const course = this.courses().find(c => c.courseId === courseId);
      const maxLevel = course?.levels && course.levels.length > 0
        ? Math.max(...course.levels.map(l => l.levelNumber))
        : 0;
      this.levelForm.reset({
        levelNumber: maxLevel + 1,
        levelName: '',
        objectives: '',
        durationWeeks: 4
      });
    }

    showForm.set(courseId, true);
    this.showLevelForm.set(showForm);
  }

  closeLevelForm(courseId: number) {
    const showForm = new Map(this.showLevelForm());
    showForm.delete(courseId);
    this.showLevelForm.set(showForm);
    this.editingLevel.set(null);
    this.levelForm.reset();
  }

  onSubmitLevel(courseId: number) {
    if (this.levelForm.invalid) {
      this.levelForm.markAllAsTouched();
      return;
    }

    const levelData = {
      levelNumber: this.levelForm.value.levelNumber,
      levelName: this.levelForm.value.levelName,
      objectives: this.levelForm.value.objectives,
      durationWeeks: this.levelForm.value.durationWeeks
    };

    const editingLevel = this.editingLevel();

    if (editingLevel && editingLevel.levelId) {
      // Update level
      this.apiService.updateLevel(editingLevel.levelId, levelData).subscribe(
        handleResponse(this.loggingService, (data: any) => {
          this.loggingService.onSuccess('Level updated successfully!');
          this.closeLevelForm(courseId);
          this.loadLevelsForCourse(courseId);
        })
      );
    } else {
      // Create level
      this.apiService.createLevel(courseId, levelData).subscribe(
        handleResponse(this.loggingService, (data: any) => {
          this.loggingService.onSuccess('Level created successfully!');
          this.closeLevelForm(courseId);
          this.loadLevelsForCourse(courseId);
        })
      );
    }
  }

  deleteLevel(courseId: number, levelId: number) {
    if (confirm('Are you sure you want to delete this level?')) {
      this.apiService.deleteLevel(levelId).subscribe(
        handleResponse(this.loggingService, () => {
          this.loggingService.onSuccess('Level deleted successfully!');
          this.loadLevelsForCourse(courseId);
        })
      );
    }
  }

  isLevelFormOpen(courseId: number): boolean {
    return this.showLevelForm().has(courseId);
  }

  getLevelCount(course: Course): number {
    return course.levels?.length || 0;
  }

  getTotalWeeks(course: Course): number {
    if (!course.levels || course.levels.length === 0) {
      return 0;
    }
    return course.levels.reduce((total, level) => total + level.durationWeeks, 0);
  }

  // Form validation helpers
  get courseNameError(): string {
    const control = this.courseForm.get('courseName');
    if (control?.hasError('required') && control.touched) {
      return 'Course name is required';
    }
    if (control?.hasError('minlength') && control.touched) {
      return 'Course name must be at least 3 characters';
    }
    if (control?.hasError('duplicate') && control.touched) {
      return 'Course name must be unique. A course with this name already exists.';
    }
    return '';
  }

  get descriptionError(): string {
    const control = this.courseForm.get('description');
    if (control?.hasError('required') && control.touched) {
      return 'Description is required';
    }
    if (control?.hasError('minlength') && control.touched) {
      return 'Description must be at least 50 characters';
    }
    return '';
  }
}

