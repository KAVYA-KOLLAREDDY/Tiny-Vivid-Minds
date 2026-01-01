package com.example.TVM.config;

import org.springframework.stereotype.Component;

/**
 * Configuration class for certificate text positioning
 * Adjust these values based on your TinyVivdMindsCertification.pdf template
 */
@Component
public class CertificateLayoutConfig {

    // ===== FONT SIZES =====
    public static final int TITLE_FONT_SIZE = 18;
    public static final int REGULAR_FONT_SIZE = 16;
    public static final int SMALL_FONT_SIZE = 14;

    // ===== VERTICAL POSITIONS (Y-coordinates from bottom of page) =====
    // These are relative positions - adjust based on your template layout
    // Higher values = higher on the page, Lower values = lower on the page

    // Main title/student name position (usually near top)
    public static final float STUDENT_NAME_Y_OFFSET = 150;

    // Course title position
    public static final float COURSE_TITLE_Y_OFFSET = 200;

    // Main completion statement
    public static final float COMPLETION_TEXT_Y_OFFSET = 250;

    // Score/percentage position
    public static final float SCORE_TEXT_Y_OFFSET = 300;

    // Level completion position
    public static final float LEVEL_TEXT_Y_OFFSET = 320;

    // Date position (usually near bottom)
    public static final float DATE_Y_OFFSET = 400;

    // ===== HORIZONTAL ALIGNMENT =====
    // All text is centered horizontally by default
    // You can add specific X offsets if needed for left/right alignment

    /**
     * Instructions for adjusting positions:
     * 1. Open TinyVivdMindsCertification.pdf in a PDF viewer
     * 2. Use measuring tools to find exact coordinates
     * 3. Coordinates are from bottom-left corner (0,0)
     * 4. Page height is typically around 792-842 points for A4
     * 5. Update the Y_OFFSET values above accordingly
     */
}
