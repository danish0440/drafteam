import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react'

const Projects = () => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  
  // Workshop projects data
  const projects = [
    // Approved projects (1-14 + 30)
    { id: 1, name: 'R-Tune Auto', description: 'Automotive workshop renovation and layout optimization', status: 'completed', progress: 100, assignee: 'ADIP', dueDate: '2024-01-15', startDate: '2023-12-01', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 2, name: 'RAB Ceria', description: 'Workshop facility upgrade and modernization', status: 'completed', progress: 100, assignee: 'ELYAS', dueDate: '2024-01-20', startDate: '2023-12-05', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 3, name: 'Amran Quality', description: 'Quality control workshop design and implementation', status: 'completed', progress: 100, assignee: 'SYAHMI', dueDate: '2024-01-25', startDate: '2023-12-10', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 4, name: 'MFN Utara', description: 'Northern region workshop expansion project', status: 'completed', progress: 100, assignee: 'ALIP', dueDate: '2024-02-01', startDate: '2023-12-15', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 5, name: 'ZRS Garage', description: 'Garage facility renovation and equipment layout', status: 'completed', progress: 100, assignee: 'ADIP', dueDate: '2024-02-05', startDate: '2023-12-20', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 6, name: 'Pahlawan Aircond', description: 'Air conditioning workshop design and setup', status: 'completed', progress: 100, assignee: 'ELYAS', dueDate: '2024-02-10', startDate: '2024-01-01', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 7, name: 'Peroda Autowork', description: 'Automotive service center layout optimization', status: 'completed', progress: 100, assignee: 'SYAHMI', dueDate: '2024-02-15', startDate: '2024-01-05', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 8, name: 'ZL Autowork', description: 'Auto workshop facility design and renovation', status: 'completed', progress: 100, assignee: 'ALIP', dueDate: '2024-02-20', startDate: '2024-01-10', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 9, name: 'Splendid Auto', description: 'Premium automotive service facility design', status: 'completed', progress: 100, assignee: 'ADIP', dueDate: '2024-02-25', startDate: '2024-01-15', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 10, name: 'Sinar Maju', description: 'Workshop modernization and efficiency improvement', status: 'completed', progress: 100, assignee: 'ELYAS', dueDate: '2024-03-01', startDate: '2024-01-20', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 11, name: 'Rast Maju', description: 'Advanced workshop layout and equipment planning', status: 'completed', progress: 100, assignee: 'SYAHMI', dueDate: '2024-03-05', startDate: '2024-01-25', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 12, name: 'EJ Workshop', description: 'Comprehensive workshop renovation project', status: 'completed', progress: 100, assignee: 'ALIP', dueDate: '2024-03-10', startDate: '2024-02-01', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 13, name: 'Bangi Motorsport', description: 'Motorsport facility design and construction', status: 'completed', progress: 100, assignee: 'ADIP', dueDate: '2024-03-15', startDate: '2024-02-05', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 14, name: 'NZRY', description: 'Specialized workshop design and implementation', status: 'completed', progress: 100, assignee: 'ELYAS', dueDate: '2024-03-20', startDate: '2024-02-10', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 30, name: 'OD Tune Garage', description: 'Performance tuning workshop design', status: 'completed', progress: 100, assignee: 'SYAHMI', dueDate: '2024-04-01', startDate: '2024-03-01', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    
    // Projects with 2D completed
    { id: 35, name: 'FZ AUTO', description: 'Automotive service center renovation', status: 'in-progress', progress: 85, assignee: 'ADIP', dueDate: '2024-04-15', startDate: '2024-03-15', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 39, name: 'QCar Autocare', description: 'Car care facility design and setup', status: 'in-progress', progress: 85, assignee: 'ELYAS', dueDate: '2024-04-20', startDate: '2024-03-20', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 41, name: 'Borneo NMK Accessories', description: 'Automotive accessories workshop design', status: 'in-progress', progress: 85, assignee: 'SYAHMI', dueDate: '2024-04-25', startDate: '2024-03-25', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 21, name: 'The Big Bang Auto', description: 'Comprehensive auto service facility', status: 'in-progress', progress: 85, assignee: 'ALIP', dueDate: '2024-05-01', startDate: '2024-04-01', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 37, name: 'Expert Auto Workshop', description: 'Expert-level automotive service center', status: 'in-progress', progress: 85, assignee: 'ADIP', dueDate: '2024-05-05', startDate: '2024-04-05', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 38, name: 'ZF Auto', description: 'Modern automotive workshop design', status: 'in-progress', progress: 85, assignee: 'ELYAS', dueDate: '2024-05-10', startDate: '2024-04-10', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 42, name: 'Albin Workshop', description: 'Specialized automotive workshop renovation', status: 'in-progress', progress: 85, assignee: 'SYAHMI', dueDate: '2024-05-15', startDate: '2024-04-15', drawings2D: { completed: 17, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    
    // Currently in progress projects
    { id: 43, name: 'N-Rich Tyres & Services', description: 'Tire service center design and renovation', status: 'in-progress', progress: 60, assignee: 'ADIP', dueDate: '2024-05-20', startDate: '2024-04-20', drawings2D: { completed: 10, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 45, name: 'Aman Autopart & Services', description: 'Auto parts and service facility design', status: 'in-progress', progress: 55, assignee: 'ELYAS', dueDate: '2024-05-25', startDate: '2024-04-25', drawings2D: { completed: 9, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 23, name: 'Cyber Pitwork', description: 'High-tech automotive service center', status: 'in-progress', progress: 50, assignee: 'SYAHMI', dueDate: '2024-06-01', startDate: '2024-05-01', drawings2D: { completed: 8, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 44, name: 'Auto Garage II', description: 'Second phase auto garage development', status: 'in-progress', progress: 45, assignee: 'ALIP', dueDate: '2024-06-05', startDate: '2024-05-05', drawings2D: { completed: 7, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    
    // Remaining projects - not started or early stage
    { id: 15, name: 'Azwa Automotive', description: 'Automotive service facility development', status: 'not-started', progress: 0, assignee: 'ADIP', dueDate: '2024-06-10', startDate: '2024-05-10', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 16, name: 'Zahra Energy Services', description: 'Energy-efficient workshop design', status: 'not-started', progress: 0, assignee: 'ELYAS', dueDate: '2024-06-15', startDate: '2024-05-15', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 17, name: 'Magnitude', description: 'Large-scale automotive facility project', status: 'not-started', progress: 0, assignee: 'SYAHMI', dueDate: '2024-06-20', startDate: '2024-05-20', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 18, name: 'ZL Auto', description: 'Automotive workshop expansion project', status: 'not-started', progress: 0, assignee: 'ALIP', dueDate: '2024-06-25', startDate: '2024-05-25', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 19, name: 'Monkeysepana', description: 'Unique automotive service concept design', status: 'not-started', progress: 0, assignee: 'ADIP', dueDate: '2024-07-01', startDate: '2024-06-01', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 20, name: 'Automech Service Centre', description: 'Comprehensive automotive service center', status: 'not-started', progress: 0, assignee: 'ELYAS', dueDate: '2024-07-05', startDate: '2024-06-05', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 22, name: 'Freskool', description: 'Modern cooling system workshop design', status: 'not-started', progress: 0, assignee: 'SYAHMI', dueDate: '2024-07-10', startDate: '2024-06-10', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 24, name: 'Iman Auto Services', description: 'Automotive service facility renovation', status: 'not-started', progress: 0, assignee: 'ALIP', dueDate: '2024-07-15', startDate: '2024-06-15', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 25, name: 'MNI Auto Garage', description: 'Multi-service auto garage design', status: 'not-started', progress: 0, assignee: 'ADIP', dueDate: '2024-07-20', startDate: '2024-06-20', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 26, name: 'WMH Auto Services', description: 'Comprehensive auto service center', status: 'not-started', progress: 0, assignee: 'ELYAS', dueDate: '2024-07-25', startDate: '2024-06-25', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 27, name: 'Tok Garage', description: 'Traditional garage modernization project', status: 'not-started', progress: 0, assignee: 'SYAHMI', dueDate: '2024-08-01', startDate: '2024-07-01', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 28, name: 'Nippon JDM Garage', description: 'Japanese car specialist garage design', status: 'not-started', progress: 0, assignee: 'ALIP', dueDate: '2024-08-05', startDate: '2024-07-05', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 29, name: 'Pejo Motorsport', description: 'Peugeot motorsport facility design', status: 'not-started', progress: 0, assignee: 'ADIP', dueDate: '2024-08-10', startDate: '2024-07-10', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 31, name: 'HMK Auto Service', description: 'Professional auto service center design', status: 'not-started', progress: 0, assignee: 'ELYAS', dueDate: '2024-08-15', startDate: '2024-07-15', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 32, name: 'F&A Auto Care', description: 'Full-service auto care facility', status: 'not-started', progress: 0, assignee: 'SYAHMI', dueDate: '2024-08-20', startDate: '2024-07-20', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 33, name: 'Helmy Gemilang', description: 'Premium automotive service center', status: 'not-started', progress: 0, assignee: 'ALIP', dueDate: '2024-08-25', startDate: '2024-07-25', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 34, name: 'HP Auto Motorsport', description: 'High-performance auto motorsport facility', status: 'not-started', progress: 0, assignee: 'ADIP', dueDate: '2024-09-01', startDate: '2024-08-01', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 36, name: 'Bro Auto Services', description: 'Friendly neighborhood auto service center', status: 'not-started', progress: 0, assignee: 'ELYAS', dueDate: '2024-09-05', startDate: '2024-08-05', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 40, name: 'GH Auto', description: 'General automotive service facility', status: 'not-started', progress: 0, assignee: 'SYAHMI', dueDate: '2024-09-10', startDate: '2024-08-10', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } },
    { id: 46, name: 'FZ Auto', description: 'Modern automotive service center', status: 'not-started', progress: 0, assignee: 'ALIP', dueDate: '2024-09-15', startDate: '2024-08-15', drawings2D: { completed: 0, total: 17 }, drawings3D: { completed: 0, total: 1 } }
  ]
  
  const teamMembers = ['ADIP', 'ELYAS', 'SYAHMI', 'ALIP']
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesAssignee = assigneeFilter === 'all' || project.assignee === assigneeFilter
    
    return matchesSearch && matchesStatus && matchesAssignee
  })
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'in-progress': return <Clock className="w-4 h-4 text-warning-600" />
      case 'not-started': return <AlertCircle className="w-4 h-4 text-gray-600" />
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }
  
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
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Manage and track all renovation projects</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Assignees</option>
              {teamMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(project.status)}
                  <span className={`status-badge ${getStatusColor(project.status)}`}>
                    {project.status.replace('-', ' ')}
                  </span>
                </div>
                <Link
                  to={`/projects/${project.id}`}
                  className="text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              <div className="space-y-3">
                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${getProgressColor(project.progress)}`}
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 2D Drawings */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2D Drawings</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.drawings2D.completed}/{project.drawings2D.total}
                  </span>
                </div>
                
                {/* 3D Work */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">3D Work</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.drawings3D.completed}/{project.drawings3D.total}
                  </span>
                </div>
                
                {/* Assignee and Due Date */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{project.assignee}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{project.dueDate}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Progress</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">2D Drawings</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">3D Work</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Assignee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{project.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`status-badge ${getStatusColor(project.status)}`}>
                        {project.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {project.drawings2D.completed}/{project.drawings2D.total}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {project.drawings3D.completed}/{project.drawings3D.total}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{project.assignee}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{project.dueDate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FolderOpen className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Projects