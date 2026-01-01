package com.example.TVM.service;

import java.awt.Color;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;
import org.springframework.scheduling.annotation.Async;

import com.example.TVM.config.CertificateLayoutConfig;
import com.example.TVM.entity.Certificate;
import com.example.TVM.entity.ExamSubmission;
import com.example.TVM.entity.User;
import com.example.TVM.repository.CertificateRepository;
import com.example.TVM.repository.ExamSubmissionRepository;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CertificateService {

    @Value("${certificate.template.path}")
    private String templatePath;

    @Value("${certificate.output.directory}")
    private String outputDirectory;

    private final CertificateRepository certificateRepository;
    private final JavaMailSender mailSender;
    private final ExamSubmissionRepository examSubmissionRepository;

    public Certificate generateAndStoreCertificate(Integer examSubmissionId, User teacher) {
        try {
            // Get the exam submission
            Optional<ExamSubmission> submissionOpt = examSubmissionRepository.findById(examSubmissionId);
            if (submissionOpt.isEmpty()) {
                throw new RuntimeException("Exam submission not found");
            }

            ExamSubmission submission = submissionOpt.get();
            User student = submission.getStudent();

            // Check if certificate already exists
            if (certificateRepository.existsByStudentUserIdAndCourseCourseId(
                    student.getUserId(), submission.getCourse().getCourseId())) {
                throw new RuntimeException("Certificate already exists for this student and course");
            }

            // Calculate percentage
            double percentage = 0.0;
            if (submission.getTotalQuestions() != null && submission.getTotalQuestions() > 0) {
                percentage = ((double) submission.getCorrectAnswers() / submission.getTotalQuestions()) * 100;
            }

            // Get completed level (assuming the highest completed level for the course)
            String completedLevel = getCompletedLevel(student.getUserId(), submission.getCourse().getCourseId());

            String fileName = "Certificate_" + student.getFullName().replaceAll(" ", "_")
                             + "_" + submission.getCourse().getCourseName().replaceAll(" ", "_") + ".pdf";

            Path fullPath = Paths.get(outputDirectory, fileName);
            String fullOutputPath = fullPath.toAbsolutePath().toString();

            File template = ResourceUtils.getFile("classpath:" + templatePath);
            PDDocument document = Loader.loadPDF(template);
            PDPage page = document.getPage(0);

            PDPageContentStream contentStream = new PDPageContentStream(
                    document, page, PDPageContentStream.AppendMode.APPEND, true, true);

            Color textColor = Color.BLACK;
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            float pageWidth = page.getMediaBox().getWidth();
            float pageHeight = page.getMediaBox().getHeight();

            // ===== CERTIFICATE POSITION CONFIGURATION =====
            // Using configurable positions from CertificateLayoutConfig
            float studentNameY = pageHeight - CertificateLayoutConfig.STUDENT_NAME_Y_OFFSET;
            float courseTitleY = pageHeight - CertificateLayoutConfig.COURSE_TITLE_Y_OFFSET;
            float completionTextY = pageHeight - CertificateLayoutConfig.COMPLETION_TEXT_Y_OFFSET;
            float scoreTextY = pageHeight - CertificateLayoutConfig.SCORE_TEXT_Y_OFFSET;
            float levelTextY = pageHeight - CertificateLayoutConfig.LEVEL_TEXT_Y_OFFSET;
            float dateY = pageHeight - CertificateLayoutConfig.DATE_Y_OFFSET;

            // ===== STUDENT NAME =====
            String studentName = student.getFullName();
            float nameWidth = fontBold.getStringWidth(studentName) / 1000 * CertificateLayoutConfig.TITLE_FONT_SIZE;
            contentStream.setNonStrokingColor(textColor);
            contentStream.setFont(fontBold, CertificateLayoutConfig.TITLE_FONT_SIZE);
            contentStream.beginText();
            contentStream.newLineAtOffset((pageWidth - nameWidth) / 2, studentNameY);
            contentStream.showText(studentName);
            contentStream.endText();

            // ===== COURSE COMPLETION TEXT =====
            String courseTitle = submission.getCourse().getCourseName();
            float courseWidth = fontBold.getStringWidth(courseTitle) / 1000 * CertificateLayoutConfig.REGULAR_FONT_SIZE;
            contentStream.setFont(fontBold, CertificateLayoutConfig.REGULAR_FONT_SIZE);
            contentStream.beginText();
            contentStream.newLineAtOffset((pageWidth - courseWidth) / 2, courseTitleY);
            contentStream.showText(courseTitle);
            contentStream.endText();

            // ===== COMPLETION STATEMENT =====
            String completionLine = "has successfully completed this course";
            float completionWidth = fontRegular.getStringWidth(completionLine) / 1000 * CertificateLayoutConfig.REGULAR_FONT_SIZE;
            contentStream.setFont(fontRegular, CertificateLayoutConfig.REGULAR_FONT_SIZE);
            contentStream.beginText();
            contentStream.newLineAtOffset((pageWidth - completionWidth) / 2, completionTextY);
            contentStream.showText(completionLine);
            contentStream.endText();

            // ===== SCORE/PERCENTAGE =====
            String scoreLine = "with a score of " + String.format("%.1f", percentage) + "%";
            float scoreWidth = fontRegular.getStringWidth(scoreLine) / 1000 * CertificateLayoutConfig.REGULAR_FONT_SIZE;
            contentStream.beginText();
            contentStream.newLineAtOffset((pageWidth - scoreWidth) / 2, scoreTextY);
            contentStream.showText(scoreLine);
            contentStream.endText();

            // ===== COMPLETED LEVEL =====
            if (!completedLevel.isEmpty()) {
                String levelLine = "Completed Level: " + completedLevel;
                float levelWidth = fontBold.getStringWidth(levelLine) / 1000 * CertificateLayoutConfig.SMALL_FONT_SIZE;
                contentStream.setFont(fontBold, CertificateLayoutConfig.SMALL_FONT_SIZE);
                contentStream.beginText();
                contentStream.newLineAtOffset((pageWidth - levelWidth) / 2, levelTextY);
                contentStream.showText(levelLine);
                contentStream.endText();
            }

            // ===== ISSUE DATE =====
            String issueDate = "Issued " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
            float dateWidth = fontRegular.getStringWidth(issueDate) / 1000 * CertificateLayoutConfig.REGULAR_FONT_SIZE;
            contentStream.setFont(fontRegular, CertificateLayoutConfig.REGULAR_FONT_SIZE);
            contentStream.beginText();
            contentStream.newLineAtOffset((pageWidth - dateWidth) / 2, dateY);
            contentStream.showText(issueDate);
            contentStream.endText();

            contentStream.close();

            File dir = new File(outputDirectory);
            if (!dir.exists()) dir.mkdirs();

            document.save(fullPath.toFile());
            document.close();

            // Generate verification code
            String verificationCode = generateVerificationCode();

            Certificate certificate = Certificate.builder()
                    .student(student)
                    .course(submission.getCourse())
                    .verificationCode(verificationCode)
                    .certificatePath("certificates/" + fileName)
                    .downloadUrl("certificates/" + fileName)
                    .percentage(percentage)
                    .completedLevel(completedLevel)
                    .examSubmissionId(examSubmissionId)
                    .issuedDate(LocalDateTime.now())
                    .build();

            Certificate saved = certificateRepository.save(certificate);
            sendCertificateEmail(student.getEmail(), fullOutputPath, submission.getCourse().getCourseName(), percentage, completedLevel);

            return saved;

        } catch (Exception e) {
            throw new RuntimeException("❌ Failed to generate certificate: " + e.getMessage(), e);
        }
    }

    private String getCompletedLevel(Integer studentId, Integer courseId) {
        // This is a simplified implementation. In a real scenario, you'd query StudentProgress
        // to find the highest completed level for the student in this course
        return "Advanced"; // Placeholder - you might want to implement proper level detection
    }

    private String generateVerificationCode() {
        return "CERT-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 1000);
    }

    @Async
    private void sendCertificateEmail(String recipientEmail, String attachmentPath, String courseName, double percentage, String level) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(recipientEmail);
            helper.setSubject("🎉 Congratulations! You Have Earned a Certificate");
            helper.setText("Dear Student,\n\n" +
                          "Congratulations on completing the " + courseName + " course!\n\n" +
                          "You have successfully completed Level: " + level + "\n" +
                          "Your final score: " + String.format("%.1f", percentage) + "%\n\n" +
                          "Please find your certificate attached.\n\n" +
                          "Best Regards,\n" +
                          "My3Tech Team");

            FileSystemResource file = new FileSystemResource(new File(attachmentPath));
            helper.addAttachment("Certificate.pdf", file);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send certificate email: " + e.getMessage());
        }
    }

    public List<Certificate> getCertificatesForStudent(Integer studentId) {
        return certificateRepository.findByStudentUserId(studentId);
    }
}
