import { createWorker } from 'tesseract.js'
import Typo from 'typo-js'

// Initialize spell checker with English dictionary
let dictionary = null

// Initialize dictionary (this would typically be done once when the app loads)
const initializeDictionary = async () => {
  if (!dictionary) {
    try {
      // For browser environment, we'll use a basic dictionary
      // In a real implementation, you'd load proper Hunspell dictionaries
      dictionary = new Typo('en_US')
    } catch (error) {
      console.warn('Could not initialize spell checker dictionary:', error)
      // Fallback to basic spell checking
      dictionary = {
        check: (word) => {
          // Basic spell check using common misspellings
          const commonMisspellings = {
            'recieve': 'receive',
            'seperate': 'separate',
            'occured': 'occurred',
            'definately': 'definitely',
            'accomodate': 'accommodate',
            'neccessary': 'necessary',
            'begining': 'beginning',
            'existance': 'existence',
            'maintainance': 'maintenance',
            'independant': 'independent'
          }
          return !commonMisspellings.hasOwnProperty(word.toLowerCase())
        },
        suggest: (word) => {
          const commonMisspellings = {
            'recieve': ['receive'],
            'seperate': ['separate'],
            'occured': ['occurred'],
            'definately': ['definitely'],
            'accomodate': ['accommodate'],
            'neccessary': ['necessary'],
            'begining': ['beginning'],
            'existance': ['existence'],
            'maintainance': ['maintenance'],
            'independant': ['independent']
          }
          return commonMisspellings[word.toLowerCase()] || []
        }
      }
    }
  }
  return dictionary
}

/**
 * Convert PDF to images for OCR processing
 * @param {File} pdfFile - PDF file to convert
 * @returns {Promise<Array>} Array of canvas elements containing PDF pages
 */
export const convertPDFToImages = async (pdfFile) => {
  try {
    // Import PDF.js dynamically to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    
    // Set worker source for browser environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    
    const arrayBuffer = await pdfFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      pages.push({
        canvas,
        pageNumber: pageNum,
        width: viewport.width,
        height: viewport.height
      })
    }
    
    return pages
  } catch (error) {
    console.error('Error converting PDF to images:', error)
    throw new Error('Failed to convert PDF to images for OCR processing')
  }
}

/**
 * Extract text from PDF using OCR
 * @param {File} pdfFile - PDF file to process
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} Extracted text data with page information
 */
export const extractTextFromPDF = async (pdfFile, progressCallback = () => {}) => {
  try {
    progressCallback({ status: 'Converting PDF to images...', progress: 0 })
    
    // Convert PDF pages to images
    const pages = await convertPDFToImages(pdfFile)
    
    progressCallback({ status: 'Initializing OCR...', progress: 10 })
    
    // Initialize Tesseract worker
    const worker = await createWorker('eng')
    
    const extractedPages = []
    const totalPages = pages.length
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      progressCallback({ 
        status: `Processing page ${i + 1} of ${totalPages}...`, 
        progress: 10 + (i / totalPages) * 80 
      })
      
      // Perform OCR on the page
      const { data } = await worker.recognize(page.canvas)
      
      // Extract words with bounding boxes and confidence
      const words = (data.words || []).map(word => ({
        text: word.text || '',
        confidence: word.confidence || 0,
        bbox: word.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
        pageNumber: page.pageNumber
      }))
      
      extractedPages.push({
        pageNumber: page.pageNumber,
        text: data.text || '',
        words: words,
        confidence: data.confidence || 0
      })
    }
    
    await worker.terminate()
    
    progressCallback({ status: 'OCR completed', progress: 100 })
    
    return {
      pages: extractedPages,
      totalPages: pages.length,
      totalWords: extractedPages.reduce((acc, page) => acc + page.words.length, 0)
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Check spelling of extracted text
 * @param {Object} extractedText - Text data from OCR
 * @returns {Promise<Object>} Spelling analysis results
 */
export const checkSpelling = async (extractedText) => {
  try {
    await initializeDictionary()
    
    const misspelledWords = []
    const allWords = []
    
    // Process each page
    for (const page of extractedText.pages) {
      for (const word of page.words) {
        const cleanWord = word.text.replace(/[^a-zA-Z]/g, '').toLowerCase()
        
        // Skip empty words or single characters
        if (cleanWord.length < 2) continue
        
        allWords.push({
          original: word.text,
          clean: cleanWord,
          pageNumber: page.pageNumber,
          confidence: word.confidence,
          bbox: word.bbox
        })
        
        // Check spelling
        if (!dictionary.check(cleanWord)) {
          const suggestions = dictionary.suggest ? dictionary.suggest(cleanWord) : []
          
          misspelledWords.push({
            word: word.text,
            cleanWord: cleanWord,
            suggestions: suggestions.slice(0, 3), // Top 3 suggestions
            pageNumber: page.pageNumber,
            confidence: word.confidence,
            bbox: word.bbox
          })
        }
      }
    }
    
    return {
      totalWords: allWords.length,
      misspelledWords: misspelledWords,
      misspelledCount: misspelledWords.length,
      accuracy: ((allWords.length - misspelledWords.length) / allWords.length * 100).toFixed(1)
    }
  } catch (error) {
    console.error('Error checking spelling:', error)
    throw new Error('Failed to check spelling')
  }
}

/**
 * Analyze page layout and arrangement
 * @param {Object} extractedText - Text data from OCR
 * @returns {Promise<Object>} Layout analysis results
 */
export const analyzePageLayout = async (extractedText) => {
  try {
    const layoutAnalysis = {
      pages: [],
      titleBlocks: [],
      consistencyIssues: [],
      overallScore: 0
    }
    
    // Analyze each page
    for (const page of extractedText.pages) {
      const pageAnalysis = {
        pageNumber: page.pageNumber,
        textBlocks: [],
        titleBlock: null,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        issues: []
      }
      
      // Group words into text blocks based on proximity
      const textBlocks = groupWordsIntoBlocks(page.words)
      pageAnalysis.textBlocks = textBlocks
      
      // Identify potential title blocks (usually at top, larger text, centered)
      const titleBlock = identifyTitleBlock(textBlocks)
      if (titleBlock) {
        pageAnalysis.titleBlock = titleBlock
        layoutAnalysis.titleBlocks.push({
          pageNumber: page.pageNumber,
          ...titleBlock
        })
      }
      
      // Calculate margins
      pageAnalysis.margins = calculateMargins(page.words)
      
      // Check for layout issues
      const issues = checkLayoutIssues(pageAnalysis)
      pageAnalysis.issues = issues
      layoutAnalysis.consistencyIssues.push(...issues)
      
      layoutAnalysis.pages.push(pageAnalysis)
    }
    
    // Calculate overall consistency score
    const totalIssues = layoutAnalysis.consistencyIssues.length
    const maxPossibleIssues = extractedText.pages.length * 3 // Assume max 3 issues per page
    layoutAnalysis.overallScore = Math.max(0, ((maxPossibleIssues - totalIssues) / maxPossibleIssues * 100)).toFixed(1)
    
    return layoutAnalysis
  } catch (error) {
    console.error('Error analyzing page layout:', error)
    throw new Error('Failed to analyze page layout')
  }
}

/**
 * Group words into text blocks based on proximity
 * @param {Array} words - Array of word objects with bounding boxes
 * @returns {Array} Array of text blocks
 */
const groupWordsIntoBlocks = (words) => {
  if (!words || words.length === 0) return []
  
  const blocks = []
  const threshold = 20 // Pixel threshold for grouping
  
  // Sort words by vertical position first, then horizontal
  const sortedWords = [...words].sort((a, b) => {
    if (Math.abs(a.bbox.y0 - b.bbox.y0) < threshold) {
      return a.bbox.x0 - b.bbox.x0
    }
    return a.bbox.y0 - b.bbox.y0
  })
  
  let currentBlock = {
    words: [sortedWords[0]],
    bbox: { ...sortedWords[0].bbox },
    text: sortedWords[0].text
  }
  
  for (let i = 1; i < sortedWords.length; i++) {
    const word = sortedWords[i]
    const lastWord = currentBlock.words[currentBlock.words.length - 1]
    
    // Check if word belongs to current block
    const verticalDistance = Math.abs(word.bbox.y0 - lastWord.bbox.y0)
    const horizontalDistance = word.bbox.x0 - lastWord.bbox.x1
    
    if (verticalDistance < threshold && horizontalDistance < threshold * 3) {
      // Add to current block
      currentBlock.words.push(word)
      currentBlock.text += ' ' + word.text
      
      // Update block bounding box
      currentBlock.bbox.x0 = Math.min(currentBlock.bbox.x0, word.bbox.x0)
      currentBlock.bbox.y0 = Math.min(currentBlock.bbox.y0, word.bbox.y0)
      currentBlock.bbox.x1 = Math.max(currentBlock.bbox.x1, word.bbox.x1)
      currentBlock.bbox.y1 = Math.max(currentBlock.bbox.y1, word.bbox.y1)
    } else {
      // Start new block
      blocks.push(currentBlock)
      currentBlock = {
        words: [word],
        bbox: { ...word.bbox },
        text: word.text
      }
    }
  }
  
  blocks.push(currentBlock)
  return blocks
}

/**
 * Identify potential title blocks
 * @param {Array} textBlocks - Array of text blocks
 * @returns {Object|null} Title block or null if not found
 */
const identifyTitleBlock = (textBlocks) => {
  if (!textBlocks || textBlocks.length === 0) return null
  
  // Look for blocks in the top portion of the page
  const topBlocks = textBlocks.filter(block => block.bbox.y0 < 200)
  
  if (topBlocks.length === 0) return null
  
  // Find the block with characteristics of a title
  // (centered, larger text, fewer words)
  let bestCandidate = null
  let bestScore = 0
  
  for (const block of topBlocks) {
    let score = 0
    
    // Prefer blocks with fewer words (titles are usually short)
    if (block.words.length <= 5) score += 2
    
    // Prefer blocks higher on the page
    if (block.bbox.y0 < 100) score += 2
    
    // Check if text looks like a title (contains common title words)
    const titleWords = ['drawing', 'plan', 'section', 'detail', 'elevation', 'title', 'sheet']
    const hasTitle = titleWords.some(word => 
      block.text.toLowerCase().includes(word)
    )
    if (hasTitle) score += 3
    
    if (score > bestScore) {
      bestScore = score
      bestCandidate = block
    }
  }
  
  return bestCandidate
}

/**
 * Calculate page margins based on text positioning
 * @param {Array} words - Array of word objects
 * @returns {Object} Margin measurements
 */
const calculateMargins = (words) => {
  if (!words || words.length === 0) {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }
  
  const minX = Math.min(...words.map(w => w.bbox.x0))
  const maxX = Math.max(...words.map(w => w.bbox.x1))
  const minY = Math.min(...words.map(w => w.bbox.y0))
  const maxY = Math.max(...words.map(w => w.bbox.y1))
  
  // Assume standard page dimensions (these would be more accurate with actual page size)
  const pageWidth = 612 // Standard letter width in points
  const pageHeight = 792 // Standard letter height in points
  
  return {
    top: minY,
    bottom: pageHeight - maxY,
    left: minX,
    right: pageWidth - maxX
  }
}

/**
 * Check for layout consistency issues
 * @param {Object} pageAnalysis - Page analysis data
 * @returns {Array} Array of layout issues
 */
const checkLayoutIssues = (pageAnalysis) => {
  const issues = []
  
  // Check title block position
  if (pageAnalysis.titleBlock) {
    if (pageAnalysis.titleBlock.bbox.y0 > 150) {
      issues.push({
        type: 'Title Block Position',
        severity: 'medium',
        description: 'Title block appears to be positioned lower than standard',
        pageNumber: pageAnalysis.pageNumber
      })
    }
  } else {
    issues.push({
      type: 'Missing Title Block',
      severity: 'high',
      description: 'No title block detected on this page',
      pageNumber: pageAnalysis.pageNumber
    })
  }
  
  // Check margins
  const { margins } = pageAnalysis
  if (margins.left < 20) {
    issues.push({
      type: 'Margin Issue',
      severity: 'low',
      description: 'Left margin appears too small',
      pageNumber: pageAnalysis.pageNumber
    })
  }
  
  if (margins.top < 20) {
    issues.push({
      type: 'Margin Issue',
      severity: 'low',
      description: 'Top margin appears too small',
      pageNumber: pageAnalysis.pageNumber
    })
  }
  
  return issues
}

/**
 * Generate comprehensive analysis report
 * @param {File} pdfFile - Original PDF file
 * @param {Object} ocrResults - OCR extraction results
 * @param {Object} spellingResults - Spelling check results
 * @param {Object} layoutResults - Layout analysis results
 * @returns {Object} Complete analysis report
 */
export const generateAnalysisReport = (pdfFile, ocrResults, spellingResults, layoutResults) => {
  const report = {
    metadata: {
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      analysisDate: new Date().toISOString(),
      totalPages: ocrResults.totalPages
    },
    overview: {
      totalPages: ocrResults.totalPages,
      totalWords: ocrResults.totalWords,
      ocrConfidence: calculateAverageConfidence(ocrResults),
      spellingAccuracy: parseFloat(spellingResults.accuracy),
      layoutScore: parseFloat(layoutResults.overallScore)
    },
    spelling: {
      totalWords: spellingResults.totalWords,
      misspelledCount: spellingResults.misspelledCount,
      accuracy: spellingResults.accuracy,
      suggestions: spellingResults.misspelledWords.map(word => ({
        word: word.word,
        suggestions: word.suggestions,
        page: word.pageNumber,
        confidence: Math.round(word.confidence)
      }))
    },
    layout: {
      consistencyScore: layoutResults.overallScore,
      titleBlocksFound: layoutResults.titleBlocks.length,
      issues: layoutResults.consistencyIssues.map(issue => ({
        type: issue.type,
        page: issue.pageNumber,
        severity: issue.severity,
        description: issue.description
      }))
    },
    recommendations: generateRecommendations(spellingResults, layoutResults)
  }
  
  return report
}

/**
 * Calculate average OCR confidence across all pages
 * @param {Object} ocrResults - OCR results
 * @returns {number} Average confidence score
 */
const calculateAverageConfidence = (ocrResults) => {
  if (!ocrResults.pages || ocrResults.pages.length === 0) return 0
  
  const totalConfidence = ocrResults.pages.reduce((sum, page) => sum + page.confidence, 0)
  return Math.round(totalConfidence / ocrResults.pages.length)
}

/**
 * Generate recommendations based on analysis results
 * @param {Object} spellingResults - Spelling analysis results
 * @param {Object} layoutResults - Layout analysis results
 * @returns {Array} Array of recommendations
 */
const generateRecommendations = (spellingResults, layoutResults) => {
  const recommendations = []
  
  // Spelling recommendations
  if (spellingResults.misspelledCount > 0) {
    recommendations.push({
      category: 'Spelling',
      priority: spellingResults.misspelledCount > 5 ? 'high' : 'medium',
      message: `Found ${spellingResults.misspelledCount} misspelled words. Review and correct spelling errors to improve document quality.`
    })
  }
  
  // Layout recommendations
  const highSeverityIssues = layoutResults.consistencyIssues.filter(issue => issue.severity === 'high')
  if (highSeverityIssues.length > 0) {
    recommendations.push({
      category: 'Layout',
      priority: 'high',
      message: `Found ${highSeverityIssues.length} critical layout issues. Ensure title blocks are present and properly positioned.`
    })
  }
  
  const layoutScore = parseFloat(layoutResults.overallScore)
  if (layoutScore < 70) {
    recommendations.push({
      category: 'Layout',
      priority: 'medium',
      message: 'Layout consistency score is below recommended threshold. Review page arrangements and margins.'
    })
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      category: 'General',
      priority: 'low',
      message: 'Document analysis completed successfully. No major issues detected.'
    })
  }
  
  return recommendations
}