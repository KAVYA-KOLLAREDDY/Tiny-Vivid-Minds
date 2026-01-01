#!/usr/bin/env python3
"""
PDF Certificate Template Analyzer
Run this script to analyze the certificate template structure
"""

try:
    from pypdf import PdfReader

    def analyze_pdf(pdf_path):
        reader = PdfReader(pdf_path)
        page = reader.pages[0]

        print("=== PDF Certificate Template Analysis ===")
        print(f"Page size: {page.mediabox}")
        print(f"Width: {page.mediabox.width}")
        print(f"Height: {page.mediabox.height}")
        print(f"Number of pages: {len(reader.pages)}")
        print()

        # Common certificate layout positions (you'll need to adjust these)
        print("=== Suggested Text Positions (adjust based on your template) ===")
        width = page.mediabox.width
        height = page.mediabox.height

        # Center horizontally
        center_x = width / 2

        print(f"Page Center X: {center_x}")
        print(f"Page Height: {height}")
        print()

        print("Typical Certificate Positions:")
        print(f"Student Name: ({center_x}, {height - 150}) - centered, top")
        print(f"Course Title: ({center_x}, {height - 200}) - centered, below name")
        print(f"Completion Text: ({center_x}, {height - 250}) - centered, main text")
        print(f"Score/Percentage: ({center_x}, {height - 300}) - centered")
        print(f"Date: ({center_x}, {height - 350}) - centered, bottom")
        print()
        print("Note: These are estimates. Open the PDF in a PDF viewer that shows coordinates")
        print("or use a design tool to get exact positions.")

    if __name__ == "__main__":
        analyze_pdf("Server/TVM/src/main/resources/certificate-template/TinyVivdMindsCertification.pdf")

except ImportError:
    print("PyPDF2 not installed. Install with: pip install pypdf")
    print()
    print("Manual Analysis Steps:")
    print("1. Open TinyVivdMindsCertification.pdf in Adobe Acrobat or similar")
    print("2. Use the measuring tool to find coordinates")
    print("3. Note the positions for:")
    print("   - Student name (usually centered, top)")
    print("   - Course/program title")
    print("   - Completion statement")
    print("   - Score/percentage")
    print("   - Date (usually bottom)")
    print("4. Coordinates are usually from bottom-left corner (0,0)")
