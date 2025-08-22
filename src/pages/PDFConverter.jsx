import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Upload,
  Download,
  Scissors,
  Merge,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  Plus
} from 'lucide-react'
import { mergePDFs, splitPDFByPages, splitPDFByRange, downloadPDF } from '../utils/pdfUtils'
import * as pdfjsLib from 'pdfjs-dist'

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

const PDFConverter = () => {
  const [activeTab, setActiveTab] = useState('merge')
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const [pageNumbers, setPageNumbers] = useState('')
  const [startPage, setStartPage] = useState('')
  const [endPage, setEndPage] = useState('')
  const [thumbnails, setThumbnails] = useState({})
  const [pdfJsStatus, setPdfJsStatus] = useState('Loading...')

  useEffect(() => {
    const testPdfJs = async () => {
      try {
        console.log('PDFConverter mounted, PDF.js version:', pdfjsLib.version)
        console.log('Worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc)
        setPdfJsStatus(`PDF.js ${pdfjsLib.version} loaded successfully`)
      } catch (error) {
        console.error('PDF.js initialization error:', error)
        setPdfJsStatus('PDF.js failed to load')
      }
    }
    testPdfJs()
  }, [])

  // Split options state
  const [splitOptions, setSplitOptions] = useState({
    method: 'pages', // 'pages' or 'range'
    pageNumbers: '',
    startPage: 1,
    endPage: 1
  })

  const tabs = [
    { id: 'merge', label: 'Merge PDFs', icon: Merge, description: 'Combine multiple PDF files into one' },
    { id: 'split', label: 'Split PDF', icon: Scissors, description: 'Extract pages from a PDF file' }
  ]

  // Generate PDF thumbnail
  const generateThumbnail = async (file) => {
    try {
      console.log('Generating thumbnail for:', file.name)
      setPdfJsStatus(`Generating thumbnail for ${file.name}...`)
      
      const arrayBuffer = await file.arrayBuffer()
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength)
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      console.log('PDF loaded, pages:', pdf.numPages)
      
      const page = await pdf.getPage(1) // Get first page
      console.log('First page loaded')
      
      const scale = 0.5 // Scale down for thumbnail
      const viewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      console.log('Thumbnail generated successfully')
      setPdfJsStatus(`Thumbnail generated for ${file.name}`)
      return dataUrl
    } catch (error) {
      console.error('Error generating thumbnail for', file.name, ':', error)
      setPdfJsStatus(`Failed to generate thumbnail for ${file.name}: ${error.message}`)
      return null
    }
  }

  const handleFileUpload = async (event, type = 'pdf') => {
    const uploadedFiles = Array.from(event.target.files)
    const validFiles = uploadedFiles.filter(file => {
      if (type === 'pdf') {
        return file.type === 'application/pdf'
      } else if (type === 'image') {
        return file.type.startsWith('image/')
      }
      return true
    })

    if (validFiles.length !== uploadedFiles.length) {
      setError(`Some files were rejected. Please upload only ${type === 'pdf' ? 'PDF' : 'image'} files.`)
    } else {
      setError('')
    }

    const newFiles = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type
    }))

    setFiles(prevFiles => [...prevFiles, ...newFiles])
    
    // Generate thumbnails for PDF files
    if (type === 'pdf') {
      for (const fileItem of newFiles) {
        const thumbnail = await generateThumbnail(fileItem.file)
        if (thumbnail) {
          setThumbnails(prev => ({
            ...prev,
            [fileItem.id]: thumbnail
          }))
        }
      }
    }
  }

  const validateFiles = (requiredType) => {
    if (files.length === 0) {
      setError('Please select files first')
      return false
    }

    const validTypes = requiredType === 'pdf' ? ['application/pdf'] : ['image/png', 'image/jpeg', 'image/jpg']
    const invalidFiles = files.filter(fileItem => !validTypes.includes(fileItem.type))
    
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s). Expected ${requiredType.toUpperCase()} files.`)
      return false
    }

    return true
  }

  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId))
    setThumbnails(prev => {
      const newThumbnails = { ...prev }
      delete newThumbnails[fileId]
      return newThumbnails
    })
  }

  const clearFiles = () => {
    setFiles([])
    setThumbnails({})
    setResult(null)
    setError('')
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleProcess = async () => {
    setIsProcessing(true)
    setError('')
    setResult(null)

    try {
      switch (activeTab) {
        case 'merge':
          await handleMergePDFs()
          break
        case 'split':
          await handleSplitPDF()
          break
        default:
          throw new Error('Invalid operation')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMergePDFs = async () => {
    if (!validateFiles('pdf')) return
    
    if (files.length < 2) {
      setError('Please select at least 2 PDF files to merge')
      return
    }

    const fileObjects = files.map(f => f.file)
    const mergedPDF = await mergePDFs(fileObjects)
    downloadPDF(mergedPDF, 'merged-document.pdf')
    setResult({
      message: `Successfully merged ${files.length} PDF files`,
      downloadUrl: '#',
      fileName: 'merged-document.pdf'
    })
  }

  const handleSplitPDF = async () => {
    if (!validateFiles('pdf')) return
    
    if (files.length !== 1) {
      setError('Please select exactly one PDF file to split')
      return
    }

    let splitPDF
    if (splitOptions.method === 'pages' && splitOptions.pageNumbers.trim()) {
      splitPDF = await splitPDFByPages(files[0].file, splitOptions.pageNumbers)
      downloadPDF(splitPDF, `split-pages-${splitOptions.pageNumbers.replace(/,/g, '-')}.pdf`)
      setResult({
        message: `Successfully extracted pages: ${splitOptions.pageNumbers}`,
        downloadUrl: '#',
        fileName: `split-pages-${splitOptions.pageNumbers.replace(/,/g, '-')}.pdf`
      })
    } else if (splitOptions.method === 'range' && splitOptions.startPage && splitOptions.endPage) {
      const start = parseInt(splitOptions.startPage)
      const end = parseInt(splitOptions.endPage)
      splitPDF = await splitPDFByRange(files[0].file, start, end)
      downloadPDF(splitPDF, `split-pages-${start}-to-${end}.pdf`)
      setResult({
        message: `Successfully extracted pages ${start} to ${end}`,
        downloadUrl: '#',
        fileName: `split-pages-${start}-to-${end}.pdf`
      })
    } else {
      setError('Please specify either page numbers or page range')
      return
    }
  }



  const renderTabContent = () => {
    switch (activeTab) {
      case 'merge':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Upload multiple PDF files to merge them into a single document</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload PDF Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'pdf')}
                className="hidden"
              />
            </div>
          </div>
        )

      case 'split':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Upload a PDF file and specify which pages to extract</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload PDF File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'pdf')}
                className="hidden"
              />
            </div>
            
            {files.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Split Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="splitMethod"
                        value="pages"
                        checked={splitOptions.method === 'pages'}
                        onChange={(e) => setSplitOptions({...splitOptions, method: e.target.value})}
                        className="text-primary-600"
                      />
                      <span>Extract specific pages (comma-separated, e.g., 1,3,5-7)</span>
                    </label>
                    {splitOptions.method === 'pages' && (
                      <input
                        type="text"
                        placeholder="e.g., 1,3,5-7"
                        value={splitOptions.pageNumbers}
                        onChange={(e) => setSplitOptions({...splitOptions, pageNumbers: e.target.value})}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="splitMethod"
                        value="range"
                        checked={splitOptions.method === 'range'}
                        onChange={(e) => setSplitOptions({...splitOptions, method: e.target.value})}
                        className="text-primary-600"
                      />
                      <span>Extract page range</span>
                    </label>
                    {splitOptions.method === 'range' && (
                      <div className="mt-2 flex space-x-4">
                        <div>
                          <label className="block text-sm text-gray-600">From page:</label>
                          <input
                            type="number"
                            min="1"
                            value={splitOptions.startPage}
                            onChange={(e) => setSplitOptions({...splitOptions, startPage: parseInt(e.target.value) || 1})}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">To page:</label>
                          <input
                            type="number"
                            min="1"
                            value={splitOptions.endPage}
                            onChange={(e) => setSplitOptions({...splitOptions, endPage: parseInt(e.target.value) || 1})}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )



      default:
        return null
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PDF Converter</h1>
        <p className="text-gray-600 mt-1">Merge and split PDF files with ease</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    clearFiles()
                  }}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Tab Description */}
        <div className="mt-4">
          <p className="text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                {tabs.find(tab => tab.id === activeTab)?.label}
              </h2>
            </div>
            
            {renderTabContent()}

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Uploaded Files ({files.length})</h3>
                  <button
                    onClick={clearFiles}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  Status: {pdfJsStatus}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((fileItem) => (
                    <div key={fileItem.id} className="relative bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <div className="flex flex-col items-center space-y-3">
                        {thumbnails[fileItem.id] ? (
                          <div className="w-20 h-28 bg-white border border-gray-200 rounded overflow-hidden shadow-sm">
                            <img 
                              src={thumbnails[fileItem.id]} 
                              alt={`Preview of ${fileItem.name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-28 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="text-center w-full">
                          <p className="text-sm font-medium text-gray-900 truncate" title={fileItem.name}>
                            {fileItem.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{formatFileSize(fileItem.size)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process Button */}
            {files.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Process Files
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Section */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Status</h2>
            </div>
            
            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Success</p>
                    <p className="text-sm text-green-600">{result.message}</p>
                  </div>
                </div>
                
                <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </button>
              </div>
            )}

            {!error && !result && !isProcessing && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Upload files to get started</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <Loader className="w-12 h-12 text-primary-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Processing your files...</p>
              </div>
            )}
          </div>

          {/* Features Info */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Merge className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-600">Merge multiple PDFs</span>
              </div>
              <div className="flex items-center space-x-3">
                <Scissors className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-600">Split PDF by pages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PDFConverter