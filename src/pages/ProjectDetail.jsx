import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  CheckCircle,
  Circle,
  FileText,
  Box,
  Edit,
  Save,
  X,
  Upload,
  Download,
  MessageSquare,
  File,
  Trash2,
  Cloud
} from 'lucide-react'

const ProjectDetail = () => {
  const { id } = useParams()
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState('drawings')
  const [projectFiles, setProjectFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Mock data - in real app this would come from API
  const project = {
    id: parseInt(id),
    name: 'Restaurant Kitchen Upgrade',
    description: 'Modern kitchen design with improved workflow and equipment placement for a high-end restaurant.',
    status: 'in-progress',
    progress: 75,
    assignee: 'ELYAS',
    dueDate: '2024-01-20',
    startDate: '2024-01-05',
    client: 'Gourmet Bistro Inc.',
    location: '123 Main Street, Downtown',
    budget: '$45,000',
    notes: 'Client requested modern industrial design with emphasis on workflow efficiency. Special attention needed for ventilation system integration.'
  }
  
  const [drawings2D, setDrawings2D] = useState([
    { id: 1, name: 'Cover Sheet', completed: true, file: 'cover-sheet.dwg', lastModified: '2024-01-10' },
    { id: 2, name: 'Existing Layout Plan', completed: true, file: 'existing-layout.dwg', lastModified: '2024-01-08' },
    { id: 3, name: 'Front/Rear Elevation', completed: true, file: 'elevations.dwg', lastModified: '2024-01-09' },
    { id: 4, name: 'Demolition Plan', completed: true, file: 'demolition.dwg', lastModified: '2024-01-10' },
    { id: 5, name: 'Equipment Plan', completed: true, file: 'equipment.dwg', lastModified: '2024-01-12' },
    { id: 6, name: 'Construction Plan', completed: true, file: 'construction.dwg', lastModified: '2024-01-13' },
    { id: 7, name: 'Finishes Plan', completed: true, file: 'finishes.dwg', lastModified: '2024-01-14' },
    { id: 8, name: 'Electrical Plan', completed: true, file: 'electrical.dwg', lastModified: '2024-01-15' },
    { id: 9, name: 'Reflected Ceiling Plan', completed: true, file: 'ceiling.dwg', lastModified: '2024-01-16' },
    { id: 10, name: 'Supply Airline Plan', completed: true, file: 'airline.dwg', lastModified: '2024-01-17' },
    { id: 11, name: 'Furniture Plan', completed: true, file: 'furniture.dwg', lastModified: '2024-01-18' },
    { id: 12, name: 'Wall Painting Plan', completed: true, file: 'painting.dwg', lastModified: '2024-01-18' },
    { id: 13, name: 'Waiting Room Detail', completed: true, file: 'waiting-room.dwg', lastModified: '2024-01-19' },
    { id: 14, name: 'Light Bay Detail', completed: false, file: null, lastModified: null },
    { id: 15, name: 'Waste Area', completed: false, file: null, lastModified: null },
    { id: 16, name: '2 Post Lift', completed: false, file: null, lastModified: null },
    { id: 17, name: 'Scissor Lift', completed: false, file: null, lastModified: null }
  ])
  
  const [drawings3D, setDrawings3D] = useState([
    { id: 1, name: '3D Model', completed: false, file: null, lastModified: null, progress: 60 }
  ])
  
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'ELYAS',
      date: '2024-01-18',
      time: '14:30',
      message: 'Completed the furniture plan. Client approved the layout with minor adjustments to the seating area.'
    },
    {
      id: 2,
      author: 'ADIP',
      date: '2024-01-17',
      time: '09:15',
      message: 'Reviewed the electrical plan. Looks good, but we might need additional outlets near the prep stations.'
    }
  ])
  
  const toggleDrawing2D = (drawingId) => {
    setDrawings2D(prev => prev.map(drawing => 
      drawing.id === drawingId 
        ? { ...drawing, completed: !drawing.completed }
        : drawing
    ))
  }
  
  const toggleDrawing3D = (drawingId) => {
    setDrawings3D(prev => prev.map(drawing => 
      drawing.id === drawingId 
        ? { ...drawing, completed: !drawing.completed }
        : drawing
    ))
  }
  
  const completedDrawings2D = drawings2D.filter(d => d.completed).length
  const completedDrawings3D = drawings3D.filter(d => d.completed).length
  const totalProgress = Math.round(((completedDrawings2D + completedDrawings3D) / (drawings2D.length + drawings3D.length)) * 100)
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'in-progress': return 'status-in-progress'
      case 'not-started': return 'status-not-started'
      default: return 'status-not-started'
    }
  }
  
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-success-500'
    if (progress >= 50) return 'bg-warning-500'
    return 'bg-gray-400'
  }

  // File management functions
  const fetchProjectFiles = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${id}/files`)
      if (response.ok) {
        const files = await response.json()
        setProjectFiles(files)
      }
    } catch (error) {
      console.error('Error fetching project files:', error)
    }
  }

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`http://localhost:3001/api/projects/${id}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Files uploaded successfully:', result)
        fetchProjectFiles() // Refresh file list
      } else {
        console.error('Upload failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileDelete = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/projects/${id}/files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchProjectFiles() // Refresh file list
      } else {
        console.error('Delete failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Load project files on component mount
  useEffect(() => {
    fetchProjectFiles()
  }, [id])
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`status-badge ${getStatusColor(project.status)}`}>
            {project.status.replace('-', ' ')}
          </span>
          <button 
            onClick={() => setEditMode(!editMode)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            {editMode ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            <span>{editMode ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>
      </div>
      
      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Assignee</p>
              <p className="font-semibold text-gray-900">{project.assignee}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Calendar className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-semibold text-gray-900">{project.dueDate}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Clock className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <p className="font-semibold text-gray-900">{totalProgress}%</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 rounded-lg">
              <FileText className="w-5 h-5 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Drawings</p>
              <p className="font-semibold text-gray-900">{completedDrawings2D + completedDrawings3D}/{drawings2D.length + drawings3D.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Overall Progress</h2>
          <span className="text-sm text-gray-500">{totalProgress}% Complete</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressColor(totalProgress)}`}
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>2D: {completedDrawings2D}/{drawings2D.length}</span>
          <span>3D: {completedDrawings3D}/{drawings3D.length}</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('drawings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'drawings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Drawings & 3D
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Project Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <File className="w-4 h-4 inline mr-2" />
              Files ({projectFiles.length})
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'drawings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 2D Drawings */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                2D Drawings ({completedDrawings2D}/{drawings2D.length})
              </h2>
            </div>
            <div className="space-y-3">
              {drawings2D.map((drawing) => (
                <div key={drawing.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleDrawing2D(drawing.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        drawing.completed
                          ? 'bg-success-500 border-success-500 text-white'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {drawing.completed && <CheckCircle className="w-3 h-3" />}
                    </button>
                    <div>
                      <p className={`font-medium ${
                        drawing.completed ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {drawing.name}
                      </p>
                      {drawing.file && (
                        <p className="text-xs text-gray-500">
                          {drawing.file} • Modified: {drawing.lastModified}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {drawing.file ? (
                      <button className="text-primary-600 hover:text-primary-700">
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="text-gray-400 hover:text-gray-600">
                        <Upload className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 3D Work */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Box className="w-5 h-5 mr-2 text-primary-600" />
                3D Work ({completedDrawings3D}/{drawings3D.length})
              </h2>
            </div>
            <div className="space-y-3">
              {drawings3D.map((drawing) => (
                <div key={drawing.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleDrawing3D(drawing.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          drawing.completed
                            ? 'bg-success-500 border-success-500 text-white'
                            : 'border-gray-300 hover:border-primary-500'
                        }`}
                      >
                        {drawing.completed && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <div>
                        <p className={`font-medium ${
                          drawing.completed ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {drawing.name}
                        </p>
                        {drawing.file && (
                          <p className="text-xs text-gray-500">
                            {drawing.file} • Modified: {drawing.lastModified}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {drawing.file ? (
                        <button className="text-primary-600 hover:text-primary-700">
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="text-gray-400 hover:text-gray-600">
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 3D Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">3D Progress</span>
                      <span className="text-sm text-gray-500">{drawing.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${getProgressColor(drawing.progress)}`}
                        style={{ width: `${drawing.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'details' && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <p className="text-gray-900">{project.client}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p className="text-gray-900">{project.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <p className="text-gray-900">{project.budget}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <p className="text-gray-900">{project.startDate}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Notes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 text-sm leading-relaxed">{project.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'comments' && (
        <div className="card">
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {comment.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{comment.author}</span>
                  </div>
                  <span className="text-sm text-gray-500">{comment.date} at {comment.time}</span>
                </div>
                <p className="text-gray-700 ml-10">{comment.message}</p>
              </div>
            ))}
            
            {/* Add Comment */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                  ></textarea>
                  <div className="flex justify-end mt-2">
                    <button className="btn btn-primary">
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'files' && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <File className="w-5 h-5 mr-2 text-primary-600" />
              Project Files ({projectFiles.length})
            </h2>
          </div>
          
          {/* File Upload Area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Cloud className={`w-12 h-12 mx-auto mb-4 ${
               dragActive ? 'text-primary-500' : 'text-gray-400'
             }`} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dragActive ? 'Drop files here' : 'Upload PDF and DWG files'}
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop your files here, or click to browse
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.dwg"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="btn btn-primary cursor-pointer inline-flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </>
              )}
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Maximum file size: 50MB. Supported formats: PDF, DWG
            </p>
          </div>
          
          {/* Files List */}
          {projectFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h3>
              <div className="space-y-3">
                {projectFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {file.file_type === '.pdf' ? (
                          <FileText className="w-5 h-5 text-red-500" />
                        ) : (
                          <File className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.original_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)} • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">by {file.uploaded_by}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`http://localhost:3001/uploads/project_${id}/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 p-2 rounded-lg hover:bg-primary-50"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {projectFiles.length === 0 && !uploading && (
            <div className="text-center py-8">
              <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
              <p className="text-gray-500">Upload your first PDF or DWG file to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectDetail