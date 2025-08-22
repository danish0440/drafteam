import React, { useState, useRef } from 'react'
import {
  FileText,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileCheck,
  AlertCircle,
  Loader,
  X,
  Brain,
  Layers,
  Type,
  BarChart3
} from 'lucide-react'
import { extractTextFromPDF, checkSpelling, analyzePageLayout, generateAnalysisReport } from '../utils/aiDrawingUtils'

const AIDrawingChecker = () => {
  const [files, setFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)
  const [activeAnalysis, setActiveAnalysis] = useState('overview')

  const analysisTypes = [
    { id: 'overview', label: 'Overview', icon: Eye, description: 'General analysis summary' },
    { id: 'spelling', label: 'Spelling Check', icon: Type, description: 'Text spelling verification' },
    { id: 'layout', label: 'Page Layout', icon: Layers, description: 'Page arrangement analysis' }
  ]

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files)
    const validFiles = uploadedFiles.filter(file => file.type === 'application/pdf')
    
    if (validFiles.length !== uploadedFiles.length) {
      setError('Please select only PDF files')
      return
    }
    
    setFiles(validFiles)
    setError('')
    setAnalysisResult(null)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    if (newFiles.length === 0) {
      setAnalysisResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError('Please select at least one PDF file')
      return
    }

    setIsProcessing(true)
    setError('')
    setProgress(0)

    try {
      const allResults = []
      const totalFiles = files.length
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileProgress = (i / totalFiles) * 100
        
        // Extract text from PDF using OCR
        setProgress(fileProgress + 10)
        const ocrResult = await extractTextFromPDF(file, (progress) => {
          setProgress(fileProgress + (progress * 0.6)) // OCR takes 60% of file processing
        })
        
        // Perform spell checking
        setProgress(fileProgress + 70)
        const spellingResult = await checkSpelling(ocrResult)
        
        // Analyze page layout
        setProgress(fileProgress + 85)
        const layoutResult = await analyzePageLayout(ocrResult)
        
        allResults.push({
          fileName: file.name,
          ocr: ocrResult,
          spelling: spellingResult,
          layout: layoutResult
        })
        
        setProgress((i + 1) / totalFiles * 100)
      }
      
      // Combine results from all files
      const combinedResult = {
        overview: {
          totalPages: allResults.reduce((acc, result) => acc + (result.ocr?.pages?.length || 0), 0),
          filesAnalyzed: files.length,
          overallScore: allResults.length > 0 ? Math.round(allResults.reduce((acc, result) => acc + (result.spelling?.accuracy || 0), 0) / allResults.length) : 0,
          issues: allResults.reduce((acc, result) => acc + (result.spelling?.misspelledWords?.length || 0) + (result.layout?.issues?.length || 0), 0)
        },
        spelling: {
          totalWords: allResults.reduce((acc, result) => acc + (result.spelling?.totalWords || 0), 0),
          misspelledWords: allResults.reduce((acc, result) => acc + (result.spelling?.misspelledWords?.length || 0), 0),
          suggestions: allResults.flatMap(result => result.spelling?.misspelledWords?.slice(0, 10) || [])
        },
        layout: {
          consistencyScore: allResults.length > 0 ? Math.round(allResults.reduce((acc, result) => acc + (result.layout?.consistencyScore || 0), 0) / allResults.length) : 0,
          titleBlocksFound: allResults.reduce((acc, result) => acc + (result.layout?.titleBlocks?.length || 0), 0),
          layoutIssues: allResults.flatMap(result => result.layout?.issues || [])
        }
      }
      
      setAnalysisResult(combinedResult)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const downloadReport = () => {
    if (!analysisResult) return
    
    const reportData = {
      timestamp: new Date().toISOString(),
      files: files.map(f => f.name),
      analysis: analysisResult
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drawing-analysis-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderOverview = () => {
    if (!analysisResult) return null
    
    const { overview } = analysisResult
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Pages</p>
                <p className="text-2xl font-bold text-blue-900">{overview.totalPages}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Files Analyzed</p>
                <p className="text-2xl font-bold text-green-900">{overview.filesAnalyzed}</p>
              </div>
              <FileCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Overall Score</p>
                <p className="text-2xl font-bold text-purple-900">{overview.overallScore}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Issues Found</p>
                <p className="text-2xl font-bold text-orange-900">{overview.issues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSpellingAnalysis = () => {
    if (!analysisResult) return null
    
    const { spelling } = analysisResult
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Words</p>
                <p className="text-2xl font-bold text-blue-900">{spelling.totalWords}</p>
              </div>
              <Type className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Misspelled Words</p>
                <p className="text-2xl font-bold text-red-900">{spelling.misspelledWords}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Spelling Suggestions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {spelling.suggestions.map((item, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-red-600 font-medium line-through">{item.word}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium">{item.suggestion}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Page {item.page}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Confidence:</span>
                  <span className="text-sm font-medium text-blue-600">{item.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderLayoutAnalysis = () => {
    if (!analysisResult) return null
    
    const { layout } = analysisResult
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Consistency Score</p>
                <p className="text-2xl font-bold text-green-900">{layout.consistencyScore}%</p>
              </div>
              <Layers className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Title Blocks Found</p>
                <p className="text-2xl font-bold text-blue-900">{layout.titleBlocksFound}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Layout Issues</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {layout.layoutIssues && layout.layoutIssues.length > 0 ? (
              layout.layoutIssues.map((issue, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{issue.type}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    </div>
                    <span className="text-sm text-gray-500">Page {issue.page}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>No layout issues detected!</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Drawing Checker</h1>
          </div>
          <p className="text-gray-600">
            Upload your PDF drawings for AI-powered analysis of spelling and page arrangement
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload PDF Files</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              multiple
              className="hidden"
            />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Drop PDF files here or click to browse</p>
            <p className="text-gray-500 mb-4">Support for multiple PDF files</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select Files
            </button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Files</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="text-gray-900">{file.name}</span>
                      <span className="text-sm text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <div className="mt-6 flex flex-col items-center space-y-4">
            <button
              onClick={handleAnalyze}
              disabled={files.length === 0 || isProcessing}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span>Analyze Drawings</span>
                </>
              )}
            </button>
            
            {/* Progress Bar */}
            {isProcessing && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Analysis Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                {analysisTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveAnalysis(type.id)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                        activeAnalysis === type.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Analysis Content */}
            <div className="p-6">
              {activeAnalysis === 'overview' && renderOverview()}
              {activeAnalysis === 'spelling' && renderSpellingAnalysis()}
              {activeAnalysis === 'layout' && renderLayoutAnalysis()}
            </div>

            {/* Download Report Button */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={downloadReport}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIDrawingChecker