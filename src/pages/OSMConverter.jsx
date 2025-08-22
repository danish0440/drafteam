import React, { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  Download,
  Settings,
  MapPin,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Info
} from 'lucide-react'

const OSMConverter = () => {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [conversionJob, setConversionJob] = useState(null)
  const [projectionSettings, setProjectionSettings] = useState({
    projection: 'EPSG:3857',
    planType: 'key-plan'
  })
  const fileInputRef = useRef(null)

  const projections = [
    { code: 'EPSG:3857', name: 'Web Mercator (Google Maps)', description: 'Most common web mapping projection' },
    { code: 'EPSG:4326', name: 'WGS84 Geographic', description: 'Standard GPS coordinates' },
    { code: 'EPSG:32633', name: 'UTM Zone 33N', description: 'Universal Transverse Mercator' },
    { code: 'EPSG:32634', name: 'UTM Zone 34N', description: 'Universal Transverse Mercator' },
    { code: 'EPSG:32635', name: 'UTM Zone 35N', description: 'Universal Transverse Mercator' },
    { code: 'EPSG:3395', name: 'World Mercator', description: 'World Mercator projection' },
    { code: 'EPSG:2154', name: 'RGF93 / Lambert-93', description: 'France national projection' },
    { code: 'EPSG:25832', name: 'ETRS89 / UTM zone 32N', description: 'European projection' }
  ]

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['.osm', '.xml']
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
    
    if (!validTypes.includes(fileExtension)) {
      alert('Please select a valid OSM file (.osm or .xml)')
      return
    }
    
    if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
      alert('File size must be less than 100MB')
      return
    }
    
    setFile(selectedFile)
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const startConversion = async () => {
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projection', projectionSettings.projection)
    formData.append('plan_type', projectionSettings.planType)
    
    try {
      const response = await fetch('/api/osm/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const result = await response.json()
      setConversionJob({
        jobId: result.job_id,
        status: 'pending',
        progress: 0,
        message: 'Starting conversion...'
      })
      
      // Start polling for status
      pollConversionStatus(result.job_id)
      
    } catch (error) {
      console.error('Conversion failed:', error)
      alert('Conversion failed. Please try again.')
    }
  }

  const pollConversionStatus = async (jobId) => {
    try {
      const response = await fetch(`/api/osm/status/${jobId}`)
      const status = await response.json()
      
      setConversionJob(prev => ({
        ...prev,
        status: status.status,
        progress: status.progress,
        message: status.message,
        downloadUrl: status.download_url,
        stats: status.stats
      }))
      
      if (status.status === 'processing' || status.status === 'pending') {
        setTimeout(() => pollConversionStatus(jobId), 1000)
      }
    } catch (error) {
      console.error('Status polling failed:', error)
    }
  }

  const resetConverter = () => {
    setFile(null)
    setConversionJob(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    if (!conversionJob) return null
    
    switch (conversionJob.status) {
      case 'pending':
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    if (!conversionJob) return 'bg-gray-200'
    
    switch (conversionJob.status) {
      case 'pending':
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-200'
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <MapPin className="w-8 h-8 mr-3 text-primary-600" />
          OSM to DXF Converter
        </h1>
        <p className="text-gray-600">
          Convert OpenStreetMap data to AutoCAD DXF format for architectural drafting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-primary-600" />
                Upload OSM File
              </h2>
            </div>
            
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-300 hover:border-primary-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your OSM file here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports .osm and .xml files up to 100MB
                </p>
                <button className="btn btn-primary">
                  Select File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".osm,.xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetConverter}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Conversion Progress */}
                {conversionJob && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon()}
                        <span className="font-medium text-gray-900">
                          {conversionJob.message}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {conversionJob.progress}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
                        style={{ width: `${conversionJob.progress}%` }}
                      ></div>
                    </div>

                    {/* Stats */}
                    {conversionJob.stats && (
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">
                            {conversionJob.stats.nodes?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-gray-500">Nodes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">
                            {conversionJob.stats.ways?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-gray-500">Ways</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">
                            {conversionJob.stats.layers || 0}
                          </p>
                          <p className="text-xs text-gray-500">Layers</p>
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    {conversionJob.status === 'completed' && conversionJob.downloadUrl && (
                      <a
                        href={conversionJob.downloadUrl}
                        className="btn btn-success w-full flex items-center justify-center"
                        download
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download DXF File
                      </a>
                    )}
                  </div>
                )}

                {/* Convert Button */}
                {!conversionJob && (
                  <button
                    onClick={startConversion}
                    className="btn btn-primary w-full"
                  >
                    Convert to DXF
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Conversion Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-primary-600" />
                Conversion Settings
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Plan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Type
                </label>
                <select
                  value={projectionSettings.planType}
                  onChange={(e) => setProjectionSettings(prev => ({ ...prev, planType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="key-plan">Key Plan (1:2000) - Simplified</option>
                  <option value="location-plan">Location Plan (1:1000) - Detailed</option>
                </select>
              </div>

              {/* Coordinate System */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coordinate System
                </label>
                <select
                  value={projectionSettings.projection}
                  onChange={(e) => setProjectionSettings(prev => ({ ...prev, projection: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {projections.map((proj) => (
                    <option key={proj.code} value={proj.code}>
                      {proj.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {projections.find(p => p.code === projectionSettings.projection)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary-600" />
                About OSM Converter
              </h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                Convert OpenStreetMap data into professional AutoCAD DXF drawings suitable for architectural projects.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Layers className="w-4 h-4 mr-1" />
                  Features:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Automatic layer organization</li>
                  <li>Professional line weights</li>
                  <li>Multiple coordinate systems</li>
                  <li>Building outlines and roads</li>
                  <li>Waterways and natural features</li>
                </ul>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Supported formats: .osm, .xml<br />
                  Maximum file size: 100MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OSMConverter