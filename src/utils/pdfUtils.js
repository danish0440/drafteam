import { PDFDocument } from 'pdf-lib'
import jsPDF from 'jspdf'

/**
 * Merge multiple PDF files into a single PDF
 * @param {File[]} pdfFiles - Array of PDF File objects
 * @returns {Promise<Uint8Array>} - Merged PDF as Uint8Array
 */
export const mergePDFs = async (pdfFiles) => {
  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create()
    
    // Process each PDF file
    for (const file of pdfFiles) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      
      // Add each page to the merged document
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }
    
    // Serialize the merged PDF
    const pdfBytes = await mergedPdf.save()
    return pdfBytes
  } catch (error) {
    console.error('Error merging PDFs:', error)
    throw new Error('Failed to merge PDF files. Please ensure all files are valid PDFs.')
  }
}

/**
 * Split a PDF file by extracting specific pages
 * @param {File} pdfFile - PDF File object
 * @param {string} pageNumbers - Comma-separated page numbers (e.g., "1,3,5-7")
 * @returns {Promise<Uint8Array>} - Split PDF as Uint8Array
 */
export const splitPDFByPages = async (pdfFile, pageNumbers) => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const totalPages = pdf.getPageCount()
    
    // Parse page numbers
    const pagesToExtract = parsePageNumbers(pageNumbers, totalPages)
    
    if (pagesToExtract.length === 0) {
      throw new Error('No valid pages specified')
    }
    
    // Create new PDF with selected pages
    const newPdf = await PDFDocument.create()
    const copiedPages = await newPdf.copyPages(pdf, pagesToExtract.map(p => p - 1)) // Convert to 0-based index
    
    copiedPages.forEach((page) => newPdf.addPage(page))
    
    const pdfBytes = await newPdf.save()
    return pdfBytes
  } catch (error) {
    console.error('Error splitting PDF:', error)
    throw new Error('Failed to split PDF. Please check your page numbers and try again.')
  }
}

/**
 * Split a PDF file by page range
 * @param {File} pdfFile - PDF File object
 * @param {number} startPage - Start page (1-based)
 * @param {number} endPage - End page (1-based)
 * @returns {Promise<Uint8Array>} - Split PDF as Uint8Array
 */
export const splitPDFByRange = async (pdfFile, startPage, endPage) => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const totalPages = pdf.getPageCount()
    
    // Validate range
    if (startPage < 1 || endPage < 1 || startPage > totalPages || endPage > totalPages || startPage > endPage) {
      throw new Error(`Invalid page range. PDF has ${totalPages} pages.`)
    }
    
    // Create array of page indices (0-based)
    const pageIndices = []
    for (let i = startPage - 1; i < endPage; i++) {
      pageIndices.push(i)
    }
    
    // Create new PDF with selected pages
    const newPdf = await PDFDocument.create()
    const copiedPages = await newPdf.copyPages(pdf, pageIndices)
    
    copiedPages.forEach((page) => newPdf.addPage(page))
    
    const pdfBytes = await newPdf.save()
    return pdfBytes
  } catch (error) {
    console.error('Error splitting PDF by range:', error)
    throw new Error('Failed to split PDF by range. Please check your page numbers and try again.')
  }
}



/**
 * Parse page numbers string into array of page numbers
 * @param {string} pageNumbers - Comma-separated page numbers (e.g., "1,3,5-7")
 * @param {number} totalPages - Total number of pages in PDF
 * @returns {number[]} - Array of page numbers (1-based)
 */
const parsePageNumbers = (pageNumbers, totalPages) => {
  const pages = new Set()
  const parts = pageNumbers.split(',').map(part => part.trim())
  
  for (const part of parts) {
    if (part.includes('-')) {
      // Handle range (e.g., "5-7")
      const [start, end] = part.split('-').map(num => parseInt(num.trim()))
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end && i <= totalPages; i++) {
          if (i >= 1) pages.add(i)
        }
      }
    } else {
      // Handle single page
      const pageNum = parseInt(part)
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum)
      }
    }
  }
  
  return Array.from(pages).sort((a, b) => a - b)
}

/**
 * Create download link for PDF bytes
 * @param {Uint8Array} pdfBytes - PDF data
 * @param {string} filename - Filename for download
 */
export const downloadPDF = (pdfBytes, filename) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}