"""Combine COA report images into one full-COA PDF: one report per US-letter
page, scaled to fit and centered, in the order given.

    python3 -I build_full_coa.py "<Product> <size> - Batch <BATCH> - Certificates of Analysis" OUT.pdf REPORT.png [REPORT.png ...]

Needs: pip install reportlab pillow
"""
import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def main() -> None:
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    title, out, *reports = sys.argv[1:]
    page_w, page_h = letter
    pdf = canvas.Canvas(out, pagesize=letter)
    pdf.setTitle(title)
    for report in reports:
        image = ImageReader(report)
        w, h = image.getSize()
        scale = min(page_w / w, page_h / h)
        pdf.drawImage(image, (page_w - w * scale) / 2, (page_h - h * scale) / 2, w * scale, h * scale)
        pdf.showPage()
    pdf.save()
    print(f"{out}: {len(reports)} page(s)")


if __name__ == "__main__":
    main()
