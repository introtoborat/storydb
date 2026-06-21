"use client";

import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";

interface StoryPage {
  pageNumber: number;
  storyText: string;
  sceneDescription?: string | null;
  imagePrompt?: string | null;
  notes?: string | null;
}

interface StoryData {
  title: string;
  ageGroup: string;
  genre: string;
  characterGender: string;
  pages: StoryPage[];
}

export async function exportToPDF(story: StoryData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(story.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 10 + 5;

  // Metadata
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  const metadata = `Age Group: ${story.ageGroup}  |  Genre: ${story.genre}  |  Character Gender: ${story.characterGender}  |  Pages: ${story.pages.length}`;
  doc.text(metadata, margin, y);
  y += 10;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Pages
  story.pages.forEach((page) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Page header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text(`Page ${page.pageNumber}`, margin, y);
    y += 8;

    // Scene description
    if (page.sceneDescription) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      const sceneLines = doc.splitTextToSize(`Scene: ${page.sceneDescription}`, maxWidth);
      doc.text(sceneLines, margin, y);
      y += sceneLines.length * 5 + 3;
    }

    // Story text
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    const textLines = doc.splitTextToSize(page.storyText, maxWidth);
    textLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 6;
    });

    y += 8;
  });

  doc.save(`${story.title}.pdf`);
}

export async function exportToDocx(story: StoryData) {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: story.title,
          bold: true,
          size: 44, // 22pt
          font: "Calibri",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Age Group: ${story.ageGroup}  |  Genre: ${story.genre}  |  Character Gender: ${story.characterGender}  |  Pages: ${story.pages.length}`,
          size: 20,
          color: "666666",
          italics: true,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Separator line
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "─".repeat(50), color: "CCCCCC" })],
      spacing: { after: 400 },
    })
  );

  // Pages
  story.pages.forEach((page) => {
    // Page header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Page ${page.pageNumber}`,
            bold: true,
            size: 28, // 14pt
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      })
    );

    // Scene description
    if (page.sceneDescription) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Scene: ${page.sceneDescription}`,
              italics: true,
              size: 18,
              color: "888888",
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Story text
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: page.storyText,
            size: 22, // 11pt
          }),
        ],
        spacing: { after: 200 },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${story.title}.docx`);
}
