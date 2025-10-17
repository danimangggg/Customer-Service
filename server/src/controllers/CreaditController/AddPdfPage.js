const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
//const upload = multer({ dest: 'uploads/' });

const addPdf =  async (req, res) => {
  const { originalFileName } = req.body;
  const newFilePath = req.file.path;
  const originalFilePath = path.join(__basedir + "/resources/static/assets/uploads/", originalFileName);

  try {
    // Load the original PDF
    const originalPdfBytes = fs.readFileSync(originalFilePath);
    const originalPdfDoc = await PDFDocument.load(originalPdfBytes);

    // Load the new PDF
    const newPdfBytes = fs.readFileSync(newFilePath);
    const newPdfDoc = await PDFDocument.load(newPdfBytes);

    // Copy pages from new PDF to original PDF
    const newPages = await originalPdfDoc.copyPages(newPdfDoc, newPdfDoc.getPageIndices());
    newPages.forEach((page) => originalPdfDoc.addPage(page));

    // Save the updated PDF
    const updatedPdfBytes = await originalPdfDoc.save();
    fs.writeFileSync(originalFilePath, updatedPdfBytes);

    // Delete the uploaded new PDF file
    fs.unlinkSync(newFilePath);

    res.send('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).send('Failed to update file');
  }
}

module.exports = {
    addPdf
}