-- ========================================
-- Add Attendance and Exam Submissions Tables
-- ========================================

-- -------------------------------
-- ATTENDANCE TABLE
-- -------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Rescheduled') DEFAULT 'Present',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_student_course_date (student_id, course_id, class_date),
    INDEX idx_teacher (teacher_id),
    INDEX idx_class_date (class_date)
);

-- -------------------------------
-- EXAM SUBMISSIONS TABLE
-- -------------------------------
CREATE TABLE IF NOT EXISTS exam_submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    status ENUM('Pending', 'Graded', 'Approved', 'Rejected') DEFAULT 'Pending',
    grade DOUBLE,
    remarks TEXT,
    submitted_notes TEXT,
    submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_student_course (student_id, course_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status),
    INDEX idx_submitted_on (submitted_on)
);

