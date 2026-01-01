create database tvm_db;
use tvm_db;
-- ========================================
-- 🎓 Tiny Vivid Minds - LMS Database Schema
-- ========================================
-- Roles: Admin, Teacher, Student
-- Version: v1.0
-- Author: Kavya / ChatGPT
-- ========================================


-- 1️⃣ USERS TABLE
-- -------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------
-- 2️⃣ TEACHER PROFILE
-- -------------------------------
CREATE TABLE teacher_profile (
    teacher_id INT PRIMARY KEY,
    qualification VARCHAR(255),
    experience_years INT,
    specialization VARCHAR(255),
    bio TEXT,
    FOREIGN KEY (teacher_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- -------------------------------
-- 3️⃣ STUDENT PROFILE
-- -------------------------------
CREATE TABLE student_profile (
    student_id INT PRIMARY KEY,
    age INT,
    class_level VARCHAR(50),
    parent_name VARCHAR(100),
    contact_number VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- -------------------------------
-- 4️⃣ COURSES
-- -------------------------------
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- -------------------------------
-- 5️⃣ COURSE LEVELS
-- -------------------------------
CREATE TABLE course_levels (
    level_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    level_number INT NOT NULL,
    level_name VARCHAR(100),
    objectives TEXT,
    duration_weeks INT,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- -------------------------------
-- 6️⃣ TEACHER COURSE ASSIGNMENTS
-- -------------------------------
CREATE TABLE teacher_course_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (teacher_id, course_id)
);

-- -------------------------------
-- 7️⃣ STUDENT–TEACHER ASSIGNMENTS
-- -------------------------------
CREATE TABLE student_teacher_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    course_id INT NOT NULL,
    start_date DATE,
    preferred_time TIME,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES users(user_id),
    FOREIGN KEY (teacher_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

-- -------------------------------
-- 8️⃣ CLASS SCHEDULE
-- -------------------------------
CREATE TABLE class_schedule (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    scheduled_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    topic VARCHAR(255),
    level_id INT,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    FOREIGN KEY (assignment_id) REFERENCES student_teacher_assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (level_id) REFERENCES course_levels(level_id)
);

-- -------------------------------
-- 9️⃣ STUDENT PROGRESS
-- -------------------------------
CREATE TABLE student_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    level_id INT NOT NULL,
    progress_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_date DATE,
    remarks TEXT,
    FOREIGN KEY (student_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (level_id) REFERENCES course_levels(level_id)
);

-- -------------------------------
-- 🔟 AUDIT LOGS (Optional)
-- -------------------------------
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255),
    target_table VARCHAR(100),
    target_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- -------------------------------
-- ✅ SAMPLE ADMIN INSERT (optional)
-- -------------------------------
INSERT INTO users (full_name, email, password_hash, role, status)
VALUES ('System Admin', 'admin@tinyvividminds.com', 'hashed_password_here', 'admin', 'approved');

-- ========================================
-- 🚀 DATABASE READY FOR USE
-- ========================================
-- Admin can:
--   - Manage Users / Courses / Levels / Assign Teachers & Students
-- Teacher can:
--   - View Students / Calendar / Update Progress
-- Student can:
--   - View Assigned Course / Level / Progress
-- ========================================
