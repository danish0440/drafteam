import React, { useState, useEffect } from 'react';
import {
  BarChart,
  TrendingUp,
  Users,
  FolderOpen,
  Clock,
  Target,
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  Presentation as PresentationIcon,
  Activity,
  PieChart
} from 'lucide-react';

const Presentation = () => {
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  const [animationStarted, setAnimationStarted] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real-time data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard statistics
        const statsResponse = await fetch('http://localhost:3001/api/dashboard/stats');
        const statsData = await statsResponse.json();
        setDashboardStats(statsData);
        
        // Fetch all projects
        const projectsResponse = await fetch('http://localhost:3001/api/projects');
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate overall stats from real data
  const overallStats = dashboardStats ? {
    totalProjects: projects.length,
    completedProjects: dashboardStats.projectsByStatus?.find(s => s.status === 'completed')?.count || 0,
    inProgressProjects: dashboardStats.projectsByStatus?.find(s => s.status === 'in-progress')?.count || 0,
    delayedProjects: dashboardStats.projectsByStatus?.find(s => s.status === 'delayed')?.count || 0,
    teamEfficiency: Math.round((dashboardStats.projectsByStatus?.find(s => s.status === 'completed')?.count || 0) / projects.length * 100) || 0,
    weeklyTarget: 2,
    actualWeekly: 2.3
  } : {
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    delayedProjects: 0,
    teamEfficiency: 0,
    weeklyTarget: 2,
    actualWeekly: 2.3
  };

  // Calculate monthly progress from real project data
  const monthlyProgress = projects.length > 0 ? [
    { month: 'Jan', completed: projects.filter(p => new Date(p.updated_at).getMonth() === 0 && p.status === 'completed').length, target: 10 },
    { month: 'Feb', completed: projects.filter(p => new Date(p.updated_at).getMonth() === 1 && p.status === 'completed').length, target: 12 },
    { month: 'Mar', completed: projects.filter(p => new Date(p.updated_at).getMonth() === 2 && p.status === 'completed').length, target: 15 },
    { month: 'Apr', completed: projects.filter(p => new Date(p.updated_at).getMonth() === 3 && p.status === 'completed').length, target: 18 },
    { month: 'May', completed: projects.filter(p => new Date(p.updated_at).getMonth() === 4 && p.status === 'completed').length, target: 20 }
  ] : [];

  // Calculate team performance from real data
  const teamPerformance = dashboardStats?.teamPerformance ? dashboardStats.teamPerformance.map(member => ({
    name: member.assignee,
    role: member.role || 'Team Member',
    completed: member.completed_projects || 0,
    target: member.target_projects || 6,
    efficiency: member.total_projects > 0 ? Math.round((member.completed_projects / member.total_projects) * 100) : 0
  })) : [
    { name: 'Sarah Chen', role: 'Senior Architect', completed: 8, target: 6, efficiency: 133 },
    { name: 'SYAHMI', role: 'Junior Draftsman', completed: 7, target: 6, efficiency: 117 },
    { name: 'Emily Johnson', role: 'Design Lead', completed: 5, target: 6, efficiency: 83 },
    { name: 'David Kim', role: 'CAD Specialist', completed: 6, target: 6, efficiency: 100 }
  ];

  // Calculate project types from real data
  const projectTypes = projects.length > 0 ? (() => {
    const types = [
      { type: 'Automotive Workshop', count: projects.filter(p => p.project_type === 'Automotive Workshop').length, color: 'bg-blue-500' },
      { type: 'Commercial', count: projects.filter(p => p.project_type === 'Commercial').length, color: 'bg-green-500' },
      { type: 'Industrial', count: projects.filter(p => p.project_type === 'Industrial').length, color: 'bg-purple-500' },
      { type: 'Other', count: projects.filter(p => !['Automotive Workshop', 'Commercial', 'Industrial'].includes(p.project_type)).length, color: 'bg-orange-500' }
    ].filter(type => type.count > 0);
    
    const total = types.reduce((sum, type) => sum + type.count, 0);
    return types.map(type => ({
      ...type,
      percentage: total > 0 ? Math.round((type.count / total) * 100) : 0
    }));
  })() : [
    { type: 'Residential', count: 12, percentage: 50, color: 'bg-blue-500' },
    { type: 'Commercial', count: 8, percentage: 33, color: 'bg-green-500' },
    { type: 'Industrial', count: 4, percentage: 17, color: 'bg-purple-500' }
  ];

  // Calculate upcoming deadlines from real data
  const upcomingDeadlines = projects.length > 0 ? projects
    .filter(p => p.status !== 'completed' && p.due_date)
    .map(p => {
      const dueDate = new Date(p.due_date);
      const today = new Date();
      const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return {
        project: p.name,
        deadline: p.due_date,
        status: daysLeft <= 7 ? 'at-risk' : 'on-track',
        daysLeft
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3) : [
    { project: 'Downtown Office Complex', deadline: '2024-02-15', status: 'on-track', daysLeft: 5 },
    { project: 'Residential Tower A', deadline: '2024-02-20', status: 'at-risk', daysLeft: 10 },
    { project: 'Shopping Center Renovation', deadline: '2024-02-25', status: 'on-track', daysLeft: 15 }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Loading Executive Presentation</h2>
          <p className="text-gray-600">Fetching real-time data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <PresentationIcon className="w-12 h-12 text-blue-600 mr-4" />
          <h1 className="text-4xl font-bold text-gray-900">Executive Dashboard</h1>
        </div>
        <p className="text-xl text-gray-600 mb-2">Project Performance & Analytics</p>
        <p className="text-lg text-gray-500">{currentDate}</p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 transition-all duration-700 transform ${animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className={`text-3xl font-bold text-gray-900 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '600ms' }}>{overallStats.totalProjects}</p>
            </div>
            <FolderOpen className={`w-12 h-12 text-blue-500 transition-all duration-500 transform ${animationStarted ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`} style={{ transitionDelay: '400ms' }} />
          </div>
          <div className={`mt-4 flex items-center transition-all duration-500 ${animationStarted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '800ms' }}>
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+12% from last month</span>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 transition-all duration-700 transform ${animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className={`text-3xl font-bold text-gray-900 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '700ms' }}>{overallStats.completedProjects}</p>
            </div>
            <CheckCircle className={`w-12 h-12 text-green-500 transition-all duration-500 transform ${animationStarted ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`} style={{ transitionDelay: '500ms' }} />
          </div>
          <div className={`mt-4 flex items-center transition-all duration-500 ${animationStarted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '900ms' }}>
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+8% completion rate</span>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 transition-all duration-700 transform ${animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className={`text-3xl font-bold text-gray-900 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '800ms' }}>{overallStats.inProgressProjects}</p>
            </div>
            <Clock className={`w-12 h-12 text-yellow-500 transition-all duration-500 transform ${animationStarted ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`} style={{ transitionDelay: '600ms' }} />
          </div>
          <div className={`mt-4 flex items-center transition-all duration-500 ${animationStarted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '1000ms' }}>
            <span className="text-sm text-gray-600">On schedule</span>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 transition-all duration-700 transform ${animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Efficiency</p>
              <p className={`text-3xl font-bold text-gray-900 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '900ms' }}>{overallStats.teamEfficiency}%</p>
            </div>
            <Award className={`w-12 h-12 text-purple-500 transition-all duration-500 transform ${animationStarted ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}`} style={{ transitionDelay: '700ms' }} />
          </div>
          <div className={`mt-4 flex items-center transition-all duration-500 ${animationStarted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: '1100ms' }}>
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">Above target</span>
          </div>
        </div>
      </div>

     {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Team Performance Radar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="w-6 h-6 text-indigo-600 mr-2" />
            Team Performance Radar
          </h3>
          <div className="relative h-64 flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform rotate-90">
              {/* Radar Grid */}
              <g stroke="#e5e7eb" strokeWidth="1" fill="none">
                <circle cx="100" cy="100" r="80" />
                <circle cx="100" cy="100" r="60" />
                <circle cx="100" cy="100" r="40" />
                <circle cx="100" cy="100" r="20" />
                <line x1="100" y1="20" x2="100" y2="180" />
                <line x1="20" y1="100" x2="180" y2="100" />
                <line x1="156.57" y1="43.43" x2="43.43" y2="156.57" />
                <line x1="156.57" y1="156.57" x2="43.43" y2="43.43" />
              </g>
              {/* Animated Data Polygon */}
              <polygon
                points="100,40 140,70 130,140 70,130 60,70"
                fill="rgba(99, 102, 241, 0.3)"
                stroke="#6366f1"
                strokeWidth="2"
                className={`transition-all duration-2000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`}
                style={{ transitionDelay: '1000ms' }}
              />
              {/* Data Points */}
              <circle cx="100" cy="40" r="4" fill="#6366f1" className={`transition-all duration-500 ${animationStarted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '1200ms' }} />
              <circle cx="140" cy="70" r="4" fill="#6366f1" className={`transition-all duration-500 ${animationStarted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '1400ms' }} />
              <circle cx="130" cy="140" r="4" fill="#6366f1" className={`transition-all duration-500 ${animationStarted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '1600ms' }} />
              <circle cx="70" cy="130" r="4" fill="#6366f1" className={`transition-all duration-500 ${animationStarted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '1800ms' }} />
              <circle cx="60" cy="70" r="4" fill="#6366f1" className={`transition-all duration-500 ${animationStarted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '2000ms' }} />
            </svg>
            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs text-gray-600 absolute top-2 left-1/2 transform -translate-x-1/2">Quality</div>
              <div className="text-xs text-gray-600 absolute top-6 right-4">Speed</div>
              <div className="text-xs text-gray-600 absolute bottom-6 right-4">Innovation</div>
              <div className="text-xs text-gray-600 absolute bottom-6 left-4">Collaboration</div>
              <div className="text-xs text-gray-600 absolute top-6 left-4">Leadership</div>
            </div>
          </div>
        </div>

        {/* Overall Progress - Circular Progress Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
            Overall Progress
          </h3>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${78 * 2.51} ${(100 - 78) * 2.51}`}
                  className={`transition-all duration-2000 ease-out ${animationStarted ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: '800ms' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-3xl font-bold text-gray-900 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1200ms' }}>78%</div>
                  <div className={`text-sm text-gray-600 transition-all duration-500 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1400ms' }}>Complete</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className={`text-2xl font-bold text-green-600 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1000ms' }}>18</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className={`text-2xl font-bold text-blue-600 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1100ms' }}>6</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Distribution and Real-time Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Project Types Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="w-6 h-6 text-green-600 mr-2" />
            Project Distribution
          </h3>
          <div className="space-y-6">
            {projectTypes.map((type, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${type.color} transition-all duration-500 transform ${animationStarted ? 'scale-100' : 'scale-0'}`} style={{ transitionDelay: `${index * 300}ms` }}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium text-gray-900 transition-all duration-500 ${animationStarted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: `${index * 300}ms` }}>{type.type}</span>
                    <span className={`text-sm text-gray-600 transition-all duration-500 ${animationStarted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} style={{ transitionDelay: `${index * 300 + 100}ms` }}>{type.count} projects</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full ${type.color} transition-all duration-1000 ease-out`}
                      style={{ 
                        width: animationStarted ? `${type.percentage}%` : '0%',
                        transitionDelay: `${index * 300 + 200}ms`
                      }}
                    ></div>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 transition-all duration-500 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${index * 300 + 800}ms` }}>{type.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-purple-600 mr-2" />
              Real-time Activity
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Active Users</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Peak: 94</span>
              </div>
            </div>
          </h3>
          
          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className={`text-2xl font-bold text-purple-600 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '800ms' }}>94</div>
              <div className="text-xs text-gray-600">Current Active</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className={`text-2xl font-bold text-green-600 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '900ms' }}>847</div>
              <div className="text-xs text-gray-600">Today Total</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className={`text-2xl font-bold text-blue-600 transition-all duration-1000 ${animationStarted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1000ms' }}>+23%</div>
              <div className="text-xs text-gray-600">vs Yesterday</div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-56 flex items-end space-x-1 mb-4 relative">
            {[65, 45, 78, 52, 89, 67, 43, 76, 58, 82, 71, 94].map((height, index) => {
              const isHighest = height === Math.max(65, 45, 78, 52, 89, 67, 43, 76, 58, 82, 71, 94);
              return (
                <div key={index} className="flex-1 relative group h-full flex items-end">
                  <div className="w-full bg-gray-200 rounded-t relative overflow-hidden" style={{ height: '100%' }}>
                    <div className="absolute bottom-0 left-0 right-0 rounded-t">
                      <div
                        className={`w-full rounded-t transition-all duration-1000 ease-out ${
                          isHighest ? 'bg-gradient-to-t from-green-500 to-green-300' : 'bg-gradient-to-t from-purple-500 to-purple-300'
                        }`}
                        style={{
                          height: animationStarted ? `${(height / 100) * 224}px` : '0px',
                          transitionDelay: `${index * 100 + 1200}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {height} users
                    </div>
                    <div className="w-2 h-2 bg-gray-800 transform rotate-45 mx-auto -mt-1"></div>
                  </div>
                </div>
              );
            })}
            
            {/* Peak indicator */}
            <div className={`absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full transition-all duration-500 ${animationStarted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} style={{ transitionDelay: '2000ms' }}>
              Peak Hour
            </div>
          </div>
          
          {/* Time labels */}
          <div className="grid grid-cols-12 gap-1 text-xs text-gray-500">
            <span className="text-center">9AM</span>
            <span className="text-center">10AM</span>
            <span className="text-center">11AM</span>
            <span className="text-center">12PM</span>
            <span className="text-center">1PM</span>
            <span className="text-center">2PM</span>
            <span className="text-center">3PM</span>
            <span className="text-center">4PM</span>
            <span className="text-center">5PM</span>
            <span className="text-center">6PM</span>
            <span className="text-center">7PM</span>
            <span className="text-center font-medium text-purple-600">Now</span>
          </div>
          
          {/* Activity trend */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center text-green-600">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>Activity trending up</span>
            </div>
            <div className="text-gray-500">
              Last updated: just now
            </div>
          </div>
        </div>


      </div>



      {/* Team Performance */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Users className="w-6 h-6 text-indigo-600 mr-2" />
          Team Performance Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Team Member</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Completed</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Target</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Efficiency</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((member, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{member.name}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-600">{member.role}</td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {member.completed}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600">{member.target}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-semibold ${
                      member.efficiency >= 100 ? 'text-green-600' : 
                      member.efficiency >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {member.efficiency}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    {member.efficiency >= 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Exceeding
                      </span>
                    ) : member.efficiency >= 90 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        On Track
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Needs Support
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-6 h-6 text-red-600 mr-2" />
          Critical Deadlines
        </h3>
        <div className="space-y-4">
          {upcomingDeadlines.map((project, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {project.status === 'at-risk' ? (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{project.project}</h4>
                  <p className="text-sm text-gray-600">Due: {project.deadline}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  project.status === 'at-risk' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {project.daysLeft} days left
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  project.status === 'at-risk' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {project.status === 'at-risk' ? 'At Risk' : 'On Track'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Presentation;