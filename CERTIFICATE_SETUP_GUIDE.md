# TinyVivdMinds Certification Setup Guide

## Overview

This guide will help you configure the certificate generation system to work with your `TinyVivdMindsCertification.pdf` template.

## Step 1: Analyze Your PDF Template

### Method 1: Using PDF Measuring Tools

1. **Open the PDF** in Adobe Acrobat Reader or similar PDF viewer
2. **Enable measuring tools** (View → Show/Hide → Toolbar Items → Analyze)
3. **Measure the page dimensions**:
   - Note the total page width and height
   - PDF coordinates start from bottom-left corner (0,0)

### Method 2: Using Design Software

1. **Open in Adobe Illustrator, Inkscape, or similar**
2. **Use the measuring tool** to find exact positions
3. **Note coordinates** for each text element

### Method 3: Trial and Error

1. **Use the current default positions** as starting points
2. **Generate a test certificate** and adjust positions based on results

## Step 2: Identify Text Positions

### Typical Certificate Layout

```
┌─────────────────────────────────────┐
│                                     │
│        [STUDENT NAME]               │ ← studentNameY
│                                     │
│        [COURSE TITLE]               │ ← courseTitleY
│                                     │
│   [COMPLETION STATEMENT]            │ ← completionTextY
│                                     │
│   [SCORE/PERCENTAGE]                │ ← scoreTextY
│                                     │
│   [COMPLETED LEVEL]                 │ ← levelTextY
│                                     │
│                                     │
│        [ISSUE DATE]                 │ ← dateY
└─────────────────────────────────────┘
```

### Current Default Positions (in `CertificateLayoutConfig.java`)

```java
STUDENT_NAME_Y_OFFSET = 150;    // From top of page
COURSE_TITLE_Y_OFFSET = 200;    // From top of page
COMPLETION_TEXT_Y_OFFSET = 250; // From top of page
SCORE_TEXT_Y_OFFSET = 300;      // From top of page
LEVEL_TEXT_Y_OFFSET = 320;      // From top of page
DATE_Y_OFFSET = 400;            // From top of page
```

## Step 3: Adjust Positions

### How PDF Coordinates Work

- **Origin (0,0)**: Bottom-left corner of the page
- **X increases** → moving right across the page
- **Y increases** ↑ moving up the page
- **Page height**: Usually 792-842 points for A4

### Calculating Y Positions

```java
// If your page height is 792 points and you want text 2 inches from top:
float pageHeight = 792;
float desiredPositionFromTop = 144; // 2 inches * 72 points per inch
float yPosition = pageHeight - desiredPositionFromTop;
```

## Step 4: Update Configuration

Edit `Server/TVM/src/main/java/com/example/TVM/config/CertificateLayoutConfig.java`:

```java
public class CertificateLayoutConfig {
    // Adjust these values based on your template measurements
    public static final float STUDENT_NAME_Y_OFFSET = 150;    // Your measured value
    public static final float COURSE_TITLE_Y_OFFSET = 200;    // Your measured value
    public static final float COMPLETION_TEXT_Y_OFFSET = 250; // Your measured value
    public static final float SCORE_TEXT_Y_OFFSET = 300;      // Your measured value
    public static final float LEVEL_TEXT_Y_OFFSET = 320;      // Your measured value
    public static final float DATE_Y_OFFSET = 400;            // Your measured value
}
```

## Step 5: Test and Iterate

1. **Generate a test certificate** using the teacher endpoint
2. **Check the output PDF** to see if text positions are correct
3. **Adjust values** in `CertificateLayoutConfig.java`
4. **Repeat** until satisfied

## Step 6: Font and Size Adjustments

You can also adjust font sizes in the same config file:

```java
public static final int TITLE_FONT_SIZE = 18;      // Student name
public static final int REGULAR_FONT_SIZE = 16;    // Most text
public static final int SMALL_FONT_SIZE = 14;      // Level info
```

## Troubleshooting

### Text Appears in Wrong Position

- Double-check your Y offset calculations
- Remember: Y = pageHeight - desiredDistanceFromTop

### Text is Too Big/Small

- Adjust font sizes in `CertificateLayoutConfig.java`
- Ensure fonts are readable on the certificate

### Text Overlaps Template Elements

- Measure existing template elements
- Adjust positions to avoid overlap

## Example Measurement Process

1. **Measure page**: Width=612, Height=792 (standard letter)
2. **Measure student name position**: 2 inches from top
3. **Calculate Y**: 792 - (2 \* 72) = 792 - 144 = 648
4. **Set STUDENT_NAME_Y_OFFSET = 144**

## API Endpoint

Once configured, use this endpoint to generate certificates:

```
POST /api/teacher/exam-submissions/{submissionId}/certificate
```

This will generate a certificate and email it to the student.
