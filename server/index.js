require('dotenv').config()
const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const projectId = req.params.id
    const projectDir = path.join(uploadsDir, `project_${projectId}`)
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true })
    }
    cb(null, projectDir)
  },
  filename: function (req, file, cb) {
    // Keep original filename with timestamp prefix
    const timestamp = Date.now()
    const originalName = file.originalname
    cb(null, `${timestamp}_${originalName}`)
  }
})

// File filter for PDF and DWG files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/acad', 'application/dwg', 'image/vnd.dwg']
  const allowedExtensions = ['.pdf', '.dwg']
  
  const fileExtension = path.extname(file.originalname).toLowerCase()
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true)
  } else {
    cb(new Error('Only PDF and DWG files are allowed'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
})

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir))

// Database setup with corruption handling
const dbPath = path.join(dbDir, 'drafttracker.db')

// Remove corrupted database if it exists
if (fs.existsSync(dbPath)) {
  try {
    // Test if database is accessible
    const testDb = new sqlite3.Database(dbPath)
    testDb.close()
  } catch (error) {
    console.log('Corrupted database detected, removing...', error.message)
    fs.unlinkSync(dbPath)
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message)
    // If database is corrupted, remove it and try again
    if (err.code === 'SQLITE_CORRUPT') {
      console.log('Removing corrupted database and recreating...')
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath)
      }
      // Create new database
      const newDb = new sqlite3.Database(dbPath)
      return newDb
    }
  } else {
    console.log('Connected to SQLite database successfully')
  }
})

// Initialize database tables
db.serialize(() => {
  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      assignee TEXT NOT NULL,
      status TEXT DEFAULT 'not-started',
      progress INTEGER DEFAULT 0,
      start_date DATE,
      due_date DATE,
      budget DECIMAL(10,2),
      client TEXT,
      project_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Team members table
  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      join_date DATE,
      skills TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Drawing checklist table
  db.run(`
    CREATE TABLE IF NOT EXISTS drawing_checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      drawing_name TEXT NOT NULL,
      is_completed BOOLEAN DEFAULT 0,
      completed_date DATETIME,
      notes TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `)
  
  // 3D work table
  db.run(`
    CREATE TABLE IF NOT EXISTS three_d_work (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      model_name TEXT NOT NULL,
      status TEXT DEFAULT 'not-started',
      progress INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `)
  
  // Comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `)
  
  // Project files table
  db.run(`
    CREATE TABLE IF NOT EXISTS project_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      file_path TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `)
  
  // Insert sample data if tables are empty
  db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
    if (err) {
      console.error('Error checking projects table:', err)
      return
    }
    
    if (row.count === 0) {
      console.log('Inserting sample data...')
      
      // Sample team members
      const teamMembers = [
        ['ADIP', 'adip@company.com', 'Senior Draftsman', '+1 (555) 123-4567', '2022-03-15', JSON.stringify(['AutoCAD', '3D Modeling', 'Revit', 'SketchUp', 'Construction Plans'])],
        ['ELYAS', 'elyas@company.com', 'Junior Draftsman', '+1 (555) 234-5678', '2021-08-20', JSON.stringify(['AutoCAD', 'Revit', 'MEP Systems', 'Project Management', 'Client Relations'])],
        ['SYAHMI', 'syahmi@company.com', 'Junior Draftsman', '+1 (555) 345-6789', '2023-01-10', JSON.stringify(['AutoCAD', '3D Visualization', 'Retail Design', 'Space Planning'])],
        ['ALIP', 'alip@company.com', 'Junior Draftsman', '+1 (555) 456-7890', '2023-09-05', JSON.stringify(['AutoCAD', 'Basic 3D Modeling', 'Technical Drawing', 'Learning Revit'])]
      ]
      
      teamMembers.forEach(member => {
        db.run('INSERT INTO team_members (name, email, role, phone, join_date, skills) VALUES (?, ?, ?, ?, ?, ?)', member)
      })
      
      // All 46 Workshop projects - complete list
      const projects = [
        // Completed projects (15 total)
        ['R-Tune Auto', 'Automotive workshop layout and equipment planning', 'ADIP', 'completed', 100, '2023-11-01', '2023-12-15', 25000.00, 'R-Tune Auto', 'Automotive Workshop'],
        ['RAB Ceria', 'Complete workshop renovation and modernization', 'ELYAS', 'completed', 100, '2023-11-15', '2024-01-10', 30000.00, 'RAB Ceria', 'Automotive Workshop'],
        ['Amran Quality', 'Quality control workshop setup', 'SYAHMI', 'completed', 100, '2023-12-01', '2024-01-20', 22000.00, 'Amran Quality', 'Automotive Workshop'],
        ['MFN Utara', 'Northern branch workshop design', 'ALIP', 'completed', 100, '2023-12-10', '2024-01-25', 28000.00, 'MFN Utara', 'Automotive Workshop'],
        ['ZRS Garage', 'Modern garage facility planning', 'ADIP', 'completed', 100, '2023-12-15', '2024-02-01', 26000.00, 'ZRS Garage', 'Automotive Workshop'],
        ['FZ Auto', 'Auto service center layout design', 'ELYAS', 'completed', 100, '2024-01-05', '2024-02-15', 24000.00, 'FZ Auto', 'Automotive Workshop'],
        ['QCar Autocare', 'Comprehensive auto care facility', 'SYAHMI', 'completed', 100, '2024-01-10', '2024-02-20', 27000.00, 'QCar Autocare', 'Automotive Workshop'],
        ['Borneo NMK Accessories', 'Accessories workshop and showroom', 'ALIP', 'completed', 100, '2024-01-15', '2024-02-25', 23000.00, 'Borneo NMK Accessories', 'Automotive Workshop'],
        ['OD Tune', 'Performance tuning workshop setup', 'ADIP', 'completed', 100, '2024-01-18', '2024-02-28', 25000.00, 'OD Tune', 'Automotive Workshop'],
        ['The Big Bang', 'Explosive automotive service center', 'ELYAS', 'completed', 100, '2024-01-20', '2024-03-01', 28000.00, 'The Big Bang', 'Automotive Workshop'],
        ['Expert Auto', 'Expert automotive service facility', 'SYAHMI', 'completed', 100, '2024-01-22', '2024-03-05', 26000.00, 'Expert Auto', 'Automotive Workshop'],
        ['ZF Auto', 'ZF automotive workshop design', 'ALIP', 'completed', 100, '2024-01-25', '2024-03-08', 24000.00, 'ZF Auto', 'Automotive Workshop'],
        ['Albin Workshop', 'Specialized automotive workshop', 'ADIP', 'completed', 100, '2024-01-28', '2024-03-10', 27000.00, 'Albin Workshop', 'Automotive Workshop'],
        ['Speedway Motors', 'High-performance automotive center', 'ELYAS', 'completed', 100, '2024-02-01', '2024-03-15', 32000.00, 'Speedway Motors', 'Automotive Workshop'],
        ['Precision Auto', 'Precision automotive services', 'SYAHMI', 'completed', 100, '2024-02-05', '2024-03-18', 29000.00, 'Precision Auto', 'Automotive Workshop'],
        
        // Currently active projects (4 total)
        ['N-Rich Tyres & Services', 'Tire service center with modern equipment', 'ADIP', 'in-progress', 45, '2024-01-20', '2024-02-28', 32000.00, 'N-Rich Tyres & Services', 'Automotive Workshop'],
        ['Aman Autopart & Services', 'Auto parts store and service center', 'ELYAS', 'in-progress', 40, '2024-01-22', '2024-03-05', 29000.00, 'Aman Autopart & Services', 'Automotive Workshop'],
        ['Cyber Pitwork', 'High-tech automotive diagnostic center', 'SYAHMI', 'in-progress', 35, '2024-01-25', '2024-03-10', 35000.00, 'Cyber Pitwork', 'Automotive Workshop'],
        ['Auto Garage II', 'Second phase garage expansion', 'ALIP', 'in-progress', 30, '2024-01-28', '2024-03-15', 31000.00, 'Auto Garage II', 'Automotive Workshop'],
        
        // Projects with 2D completed (7 total)
        ['Turbo Tech', 'Turbo specialization workshop', 'ADIP', 'in-progress', 85, '2024-02-10', '2024-03-20', 28000.00, 'Turbo Tech', 'Automotive Workshop'],
        ['Elite Motors', 'Elite automotive service center', 'ELYAS', 'in-progress', 80, '2024-02-12', '2024-03-22', 30000.00, 'Elite Motors', 'Automotive Workshop'],
        ['Pro Garage', 'Professional garage facility', 'SYAHMI', 'in-progress', 75, '2024-02-15', '2024-03-25', 26000.00, 'Pro Garage', 'Automotive Workshop'],
        ['Speed Zone', 'Speed-focused automotive center', 'ALIP', 'in-progress', 85, '2024-02-18', '2024-03-28', 33000.00, 'Speed Zone', 'Automotive Workshop'],
        ['Motor Hub', 'Central motor services hub', 'ADIP', 'in-progress', 80, '2024-02-20', '2024-03-30', 29000.00, 'Motor Hub', 'Automotive Workshop'],
        ['Auto Excellence', 'Excellence in automotive services', 'ELYAS', 'in-progress', 75, '2024-02-22', '2024-04-01', 31000.00, 'Auto Excellence', 'Automotive Workshop'],
        ['Garage Master', 'Master automotive workshop', 'SYAHMI', 'in-progress', 85, '2024-02-25', '2024-04-05', 27000.00, 'Garage Master', 'Automotive Workshop'],
        
        // Not started projects (20 total)
        ['Azwa Automotive', 'New automotive service facility', 'ALIP', 'not-started', 0, '2024-03-01', '2024-04-10', 26000.00, 'Azwa Automotive', 'Automotive Workshop'],
        ['Zahra Energy Services', 'Energy-efficient workshop design', 'ADIP', 'not-started', 0, '2024-03-05', '2024-04-15', 28000.00, 'Zahra Energy Services', 'Automotive Workshop'],
        ['Magnitude', 'Large-scale automotive facility', 'ELYAS', 'not-started', 0, '2024-03-08', '2024-04-18', 45000.00, 'Magnitude', 'Automotive Workshop'],
        ['Dynamic Auto', 'Dynamic automotive solutions', 'SYAHMI', 'not-started', 0, '2024-03-10', '2024-04-20', 24000.00, 'Dynamic Auto', 'Automotive Workshop'],
        ['Supreme Motors', 'Supreme automotive services', 'ALIP', 'not-started', 0, '2024-03-12', '2024-04-22', 30000.00, 'Supreme Motors', 'Automotive Workshop'],
        ['Velocity Garage', 'High-velocity automotive center', 'ADIP', 'not-started', 0, '2024-03-15', '2024-04-25', 32000.00, 'Velocity Garage', 'Automotive Workshop'],
        ['Apex Auto', 'Apex automotive workshop', 'ELYAS', 'not-started', 0, '2024-03-18', '2024-04-28', 27000.00, 'Apex Auto', 'Automotive Workshop'],
        ['Thunder Motors', 'Thunder automotive services', 'SYAHMI', 'not-started', 0, '2024-03-20', '2024-04-30', 29000.00, 'Thunder Motors', 'Automotive Workshop'],
        ['Fusion Auto', 'Fusion automotive solutions', 'ALIP', 'not-started', 0, '2024-03-22', '2024-05-02', 25000.00, 'Fusion Auto', 'Automotive Workshop'],
        ['Quantum Garage', 'Quantum automotive technology', 'ADIP', 'not-started', 0, '2024-03-25', '2024-05-05', 35000.00, 'Quantum Garage', 'Automotive Workshop'],
        ['Phoenix Motors', 'Phoenix automotive revival', 'ELYAS', 'not-started', 0, '2024-03-28', '2024-05-08', 28000.00, 'Phoenix Motors', 'Automotive Workshop'],
        ['Titan Auto', 'Titan automotive services', 'SYAHMI', 'not-started', 0, '2024-03-30', '2024-05-10', 31000.00, 'Titan Auto', 'Automotive Workshop'],
        ['Vortex Garage', 'Vortex automotive center', 'ALIP', 'not-started', 0, '2024-04-01', '2024-05-12', 26000.00, 'Vortex Garage', 'Automotive Workshop'],
        ['Nexus Motors', 'Nexus automotive solutions', 'ADIP', 'not-started', 0, '2024-04-05', '2024-05-15', 33000.00, 'Nexus Motors', 'Automotive Workshop'],
        ['Infinity Auto', 'Infinity automotive services', 'ELYAS', 'not-started', 0, '2024-04-08', '2024-05-18', 29000.00, 'Infinity Auto', 'Automotive Workshop'],
        ['Matrix Garage', 'Matrix automotive technology', 'SYAHMI', 'not-started', 0, '2024-04-10', '2024-05-20', 27000.00, 'Matrix Garage', 'Automotive Workshop'],
        ['Omega Motors', 'Omega automotive excellence', 'ALIP', 'not-started', 0, '2024-04-12', '2024-05-22', 30000.00, 'Omega Motors', 'Automotive Workshop'],
        ['Zenith Auto', 'Zenith automotive peak', 'ADIP', 'not-started', 0, '2024-04-15', '2024-05-25', 28000.00, 'Zenith Auto', 'Automotive Workshop'],
        ['Pinnacle Garage', 'Pinnacle automotive services', 'ELYAS', 'not-started', 0, '2024-04-18', '2024-05-28', 32000.00, 'Pinnacle Garage', 'Automotive Workshop'],
        ['Summit Motors', 'Summit automotive solutions', 'SYAHMI', 'not-started', 0, '2024-04-20', '2024-05-30', 34000.00, 'Summit Motors', 'Automotive Workshop']
      ]
      
      projects.forEach((project, index) => {
        db.run('INSERT INTO projects (name, description, assignee, status, progress, start_date, due_date, budget, client, project_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', project, function(err) {
          if (err) {
            console.error('Error inserting project:', err)
            return
          }
          
          const projectId = this.lastID
          
          // Insert drawing checklist for each project
          const drawings = [
            'Cover Sheet', 'Existing Layout Plan', 'Demolition Plan', 'Construction Plan',
            'Furniture Plan', 'Finish Plan', 'Reflected Ceiling Plan', 'Electrical Plan',
            'North Elevation', 'South Elevation', 'East Elevation', 'West Elevation',
            'Interior Elevations', 'Sections', 'Details', 'Equipment Schedule', 'Door Schedule'
          ]
          
          drawings.forEach(drawing => {
            const isCompleted = project[4] === 100 ? 1 : Math.random() > 0.5 ? 1 : 0
            db.run('INSERT INTO drawing_checklist (project_id, drawing_name, is_completed) VALUES (?, ?, ?)', [projectId, drawing, isCompleted])
          })
          
          // Insert 3D work items
          const threeDItems = [
            ['Conceptual Model', project[4] === 100 ? 'completed' : (project[4] > 50 ? 'in-progress' : 'not-started'), project[4]],
            ['Detailed Model', project[4] === 100 ? 'completed' : (project[4] > 70 ? 'in-progress' : 'not-started'), Math.max(0, project[4] - 20)],
            ['Rendering', project[4] === 100 ? 'completed' : (project[4] > 80 ? 'in-progress' : 'not-started'), Math.max(0, project[4] - 30)]
          ]
          
          threeDItems.forEach(item => {
            db.run('INSERT INTO three_d_work (project_id, model_name, status, progress) VALUES (?, ?, ?, ?)', [projectId, item[0], item[1], item[2]])
          })
          
          // Insert sample comments
          if (index < 3) {
            const comments = [
              ['ADIP', 'Initial review completed. Looking good so far.'],
              ['ELYAS', 'Client requested some modifications to the layout.'],
              ['SYAHMI', 'Updated drawings based on feedback.']
            ]
            
            comments.forEach(comment => {
              db.run('INSERT INTO comments (project_id, author, content) VALUES (?, ?, ?)', [projectId, comment[0], comment[1]])
            })
          }
        })
      })
    }
  })
})

// API Routes

// Get all projects
app.get('/api/projects', (req, res) => {
  const { status, assignee, search } = req.query
  let query = 'SELECT * FROM projects WHERE 1=1'
  const params = []
  
  if (status && status !== 'all') {
    query += ' AND status = ?'
    params.push(status)
  }
  
  if (assignee && assignee !== 'all') {
    query += ' AND assignee = ?'
    params.push(assignee)
  }
  
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ? OR client LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  
  query += ' ORDER BY created_at DESC'
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json(rows)
  })
})

// Get project by ID with details
app.get('/api/projects/:id', (req, res) => {
  const projectId = req.params.id
  
  // Get project details
  db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    
    // Get drawing checklist
    db.all('SELECT * FROM drawing_checklist WHERE project_id = ? ORDER BY drawing_name', [projectId], (err, drawings) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      // Get 3D work items
      db.all('SELECT * FROM three_d_work WHERE project_id = ?', [projectId], (err, threeDWork) => {
        if (err) {
          res.status(500).json({ error: err.message })
          return
        }
        
        // Get comments
        db.all('SELECT * FROM comments WHERE project_id = ? ORDER BY created_at DESC', [projectId], (err, comments) => {
          if (err) {
            res.status(500).json({ error: err.message })
            return
          }
          
          res.json({
            ...project,
            drawings,
            threeDWork,
            comments
          })
        })
      })
    })
  })
})

// Update drawing checklist item
app.put('/api/projects/:id/drawings/:drawingId', (req, res) => {
  const { drawingId } = req.params
  const { is_completed } = req.body
  
  const completedDate = is_completed ? new Date().toISOString() : null
  
  db.run(
    'UPDATE drawing_checklist SET is_completed = ?, completed_date = ? WHERE id = ?',
    [is_completed ? 1 : 0, completedDate, drawingId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Drawing not found' })
        return
      }
      
      res.json({ success: true })
    }
  )
})

// Add comment to project
app.post('/api/projects/:id/comments', (req, res) => {
  const projectId = req.params.id
  const { author, content } = req.body
  
  db.run(
    'INSERT INTO comments (project_id, author, content) VALUES (?, ?, ?)',
    [projectId, author, content],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      // Return the new comment with ID
      db.get('SELECT * FROM comments WHERE id = ?', [this.lastID], (err, comment) => {
        if (err) {
          res.status(500).json({ error: err.message })
          return
        }
        res.json(comment)
      })
    }
  )
})

// Upload files to project
app.post('/api/projects/:id/upload', upload.array('files', 10), (req, res) => {
  const projectId = req.params.id
  const uploadedFiles = req.files
  
  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }
  
  // Insert file metadata into database
  const filePromises = uploadedFiles.map(file => {
    return new Promise((resolve, reject) => {
      const fileData = {
        project_id: projectId,
        filename: file.filename,
        original_name: file.originalname,
        file_type: path.extname(file.originalname).toLowerCase(),
        file_size: file.size,
        file_path: file.path,
        uploaded_by: 'Current User' // TODO: Get from authentication
      }
      
      db.run(
        'INSERT INTO project_files (project_id, filename, original_name, file_type, file_size, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [fileData.project_id, fileData.filename, fileData.original_name, fileData.file_type, fileData.file_size, fileData.file_path, fileData.uploaded_by],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ id: this.lastID, ...fileData })
          }
        }
      )
    })
  })
  
  Promise.all(filePromises)
    .then(files => {
      res.json({ 
        message: 'Files uploaded successfully', 
        files: files 
      })
    })
    .catch(err => {
      console.error('Error saving file metadata:', err)
      res.status(500).json({ error: 'Failed to save file metadata' })
    })
})

// Get files for a project
app.get('/api/projects/:id/files', (req, res) => {
  const projectId = req.params.id
  
  db.all(
    'SELECT * FROM project_files WHERE project_id = ? ORDER BY uploaded_at DESC',
    [projectId],
    (err, files) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      res.json(files)
    }
  )
})

// Delete a file
app.delete('/api/projects/:id/files/:fileId', (req, res) => {
  const { id: projectId, fileId } = req.params
  
  // First get the file info to delete the physical file
  db.get(
    'SELECT * FROM project_files WHERE id = ? AND project_id = ?',
    [fileId, projectId],
    (err, file) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      if (!file) {
        res.status(404).json({ error: 'File not found' })
        return
      }
      
      // Delete physical file
      fs.unlink(file.file_path, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting physical file:', unlinkErr)
        }
        
        // Delete from database
        db.run(
          'DELETE FROM project_files WHERE id = ? AND project_id = ?',
          [fileId, projectId],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message })
              return
            }
            
            if (this.changes === 0) {
              res.status(404).json({ error: 'File not found' })
              return
            }
            
            res.json({ message: 'File deleted successfully' })
          }
        )
      })
    }
  )
})

// Get all team members
app.get('/api/team-members', (req, res) => {
  db.all('SELECT * FROM team_members ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    // Parse skills JSON for each member
    const members = rows.map(member => ({
      ...member,
      skills: member.skills ? JSON.parse(member.skills) : []
    }))
    
    res.json(members)
  })
})

// Get dashboard statistics
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {}
  
  // Get project counts by status
  db.all('SELECT status, COUNT(*) as count FROM projects GROUP BY status', (err, projectStats) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    stats.projectsByStatus = projectStats
    
    // Get team member project counts
    db.all(`
      SELECT assignee, 
             COUNT(*) as total_projects,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
             SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_projects
      FROM projects 
      GROUP BY assignee
    `, (err, teamStats) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      stats.teamPerformance = teamStats
      
      // Get recent projects
      db.all('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 5', (err, recentProjects) => {
        if (err) {
          res.status(500).json({ error: err.message })
          return
        }
        
        stats.recentProjects = recentProjects
        
        res.json(stats)
      })
    })
  })
})

// Reports endpoint
app.get('/api/reports', (req, res) => {
  const stats = {}
  
  // Get total project counts
  db.get(`
    SELECT 
      COUNT(*) as total_projects,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_projects,
      SUM(CASE WHEN status = 'not-started' THEN 1 ELSE 0 END) as not_started_projects
    FROM projects
  `, (err, projectStats) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    
    stats.totalProjects = projectStats.total_projects
    stats.completedProjects = projectStats.completed_projects
    stats.inProgressProjects = projectStats.in_progress_projects
    stats.notStartedProjects = projectStats.not_started_projects
    
    // Get team performance data
    db.all(`
      SELECT 
        assignee,
        COUNT(*) as total_assigned,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_projects
      FROM projects 
      WHERE assignee IS NOT NULL
      GROUP BY assignee
    `, (err, teamStats) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      
      stats.teamPerformance = teamStats
      
      // Get monthly progress (projects completed this month)
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      db.get(`
        SELECT COUNT(*) as monthly_completed
        FROM projects 
        WHERE status = 'completed' 
        AND updated_at LIKE '${currentMonth}%'
      `, (err, monthlyStats) => {
        if (err) {
          res.status(500).json({ error: err.message })
          return
        }
        
        stats.monthlyCompleted = monthlyStats.monthly_completed || 0
        
        res.json(stats)
      })
    })
  })
})

// AI Chat endpoints
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are Jamal, a friendly Malaysian AI assistant for DrafTeam, a professional drafting and workshop design company. You are based in Malaysia and speak in a warm, Malaysian-friendly manner. Always address the user as "Boss" in your responses. You specialize in analyzing workshop project data, architectural drafting, and construction project management. DrafTeam currently manages 46 automotive workshop projects with a team of 4 skilled draftsmen: ADIP, ELYAS, SYAHMI, and ALIP. You can provide insights on project progress, team performance, drawing completion status, and construction timelines. You understand Malaysian construction practices, workshop layouts, and automotive service center designs. Use Malaysian expressions occasionally (like "lah", "kan") and respond in a very friendly, professional manner. When analyzing project data, focus on practical insights about workshop efficiency, team productivity, and project completion rates. When asked to create charts or analysis, provide structured data that can be used to generate charts.'
          },
          {
            role: 'user',
            content: context ? `Context: ${JSON.stringify(context)}\n\nUser message: ${message}` : message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'DrafTeam'
        }
      }
    )

    const aiResponse = response.data.choices[0].message.content
    res.json({ response: aiResponse })
  } catch (error) {
    console.error('AI Chat Error:', error.response?.data || error.message)
    res.status(500).json({ 
      error: 'Failed to get AI response',
      details: error.response?.data?.error || error.message
    })
  }
})

// AI Analysis endpoint for generating chart data
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { data, analysisType } = req.body
    
    if (!data || !analysisType) {
      return res.status(400).json({ error: 'Data and analysis type are required' })
    }

    const prompt = `Analyze the following project data and create a ${analysisType} analysis. Return the response in JSON format with chart data that can be used with Recharts library.\n\nData: ${JSON.stringify(data)}\n\nPlease provide:\n1. A summary of insights\n2. Chart data in the format: { chartType: 'bar'|'line'|'pie', data: [...], insights: '...' }`

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: process.env.AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are Jamal, a friendly Malaysian AI data analyst for DrafTeam workshop projects. Always address the user as "Boss" and speak in a warm Malaysian manner. Analyze workshop project data with a focus on construction progress, team performance, and drafting efficiency. Return structured JSON responses with chart data for visualization. When analyzing data, consider project timelines, completion rates, team productivity, and workshop design efficiency. Use Malaysian expressions occasionally and be very friendly in your insights about the 46 automotive workshop projects managed by the DrafTeam.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'DrafTeam'
        }
      }
    )

    const aiResponse = response.data.choices[0].message.content
    
    // Try to parse JSON response
    try {
      const analysisResult = JSON.parse(aiResponse)
      res.json(analysisResult)
    } catch (parseError) {
      // If not valid JSON, create chart data based on actual project data
      let chartData = { chartType: 'pie', data: [], insights: aiResponse }
      
      if (analysisType === 'project status' && data.projects) {
        const statusCounts = data.projects.reduce((acc, project) => {
          const status = project.status || 'Not Started'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
        
        chartData = {
          chartType: 'pie',
          data: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
          insights: `Project Status Distribution: ${Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')}`
        }
      } else if (analysisType === 'progress trends' && data.projects) {
        chartData = {
          chartType: 'bar',
          data: data.projects.map(project => ({
            name: project.name || 'Unnamed Project',
            value: project.progress || 0
          })),
          insights: `Project Progress Overview: Average progress is ${Math.round(data.projects.reduce((sum, p) => sum + (p.progress || 0), 0) / data.projects.length)}%`
        }
      } else if (analysisType === 'team performance' && data.stats && data.stats.teamPerformance) {
        chartData = {
          chartType: 'pie',
          data: data.stats.teamPerformance.map(member => ({
            name: member.name,
            value: member.completedTasks || 0
          })),
          insights: `Team Performance: Total completed tasks distributed among team members`
        }
      }
      
      res.json(chartData)
    }
  } catch (error) {
    console.error('AI Analysis Error:', error.response?.data || error.message)
    res.status(500).json({ 
      error: 'Failed to get AI analysis',
      details: error.response?.data?.error || error.message
    })
  }
})

// OSM to DXF Conversion endpoints
const { spawn } = require('child_process')
const { v4: uuidv4 } = require('uuid')

// In-memory job storage (in production, use Redis or database)
const conversionJobs = new Map()

// Configure multer for OSM file uploads
const osmStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const osmDir = path.join(uploadsDir, 'osm')
    if (!fs.existsSync(osmDir)) {
      fs.mkdirSync(osmDir, { recursive: true })
    }
    cb(null, osmDir)
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now()
    const originalName = file.originalname
    cb(null, `${timestamp}_${originalName}`)
  }
})

const osmFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.osm', '.xml']
  const fileExtension = path.extname(file.originalname).toLowerCase()
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true)
  } else {
    cb(new Error('Only OSM and XML files are allowed'), false)
  }
}

const osmUpload = multer({ 
  storage: osmStorage,
  fileFilter: osmFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

// OSM file upload and conversion initiation
app.post('/api/osm/upload', osmUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const jobId = uuidv4()
    const { projection = 'EPSG:3857', plan_type = 'key-plan' } = req.body
    
    const job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      message: 'Starting conversion...',
      inputFile: req.file.path,
      outputFile: null,
      projection,
      planType: plan_type,
      createdAt: new Date(),
      stats: null
    }
    
    conversionJobs.set(jobId, job)
    
    // Start conversion process
    startOSMConversion(jobId)
    
    res.json({
      job_id: jobId,
      status: 'pending',
      message: 'Conversion job created successfully'
    })
    
  } catch (error) {
    console.error('OSM upload error:', error)
    res.status(500).json({ error: 'Upload failed', details: error.message })
  }
})

// Get conversion job status
app.get('/api/osm/status/:jobId', (req, res) => {
  const { jobId } = req.params
  const job = conversionJobs.get(jobId)
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }
  
  const response = {
    job_id: jobId,
    status: job.status,
    progress: job.progress,
    message: job.message,
    stats: job.stats
  }
  
  if (job.status === 'completed' && job.outputFile) {
    response.download_url = `/api/osm/download/${jobId}`
  }
  
  res.json(response)
})

// Download converted DXF file
app.get('/api/osm/download/:jobId', (req, res) => {
  const { jobId } = req.params
  const job = conversionJobs.get(jobId)
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }
  
  if (job.status !== 'completed' || !job.outputFile) {
    return res.status(400).json({ error: 'Conversion not completed or file not available' })
  }
  
  if (!fs.existsSync(job.outputFile)) {
    return res.status(404).json({ error: 'Output file not found' })
  }
  
  const filename = `converted_${Date.now()}.dxf`
  res.download(job.outputFile, filename)
})

// Get list of all conversion jobs
app.get('/api/osm/jobs', (req, res) => {
  const jobs = Array.from(conversionJobs.values()).map(job => ({
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    created_at: job.createdAt,
    stats: job.stats
  }))
  
  res.json({ jobs })
})

// Get supported projections
app.get('/api/osm/projections', (req, res) => {
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
  
  res.json({ projections })
})

// OSM Conversion function
function startOSMConversion(jobId) {
  const job = conversionJobs.get(jobId)
  if (!job) return
  
  job.status = 'processing'
  job.progress = 10
  job.message = 'Processing OSM data...'
  
  const outputFile = path.join(uploadsDir, 'osm', `${jobId}_output.dxf`)
  const pythonScript = path.join(__dirname, 'osm_to_dxf.py')
  
  // Prepare Python command arguments
  const args = [
    pythonScript,
    '--input', job.inputFile,
    '--output', outputFile,
    '--projection', job.projection
  ]
  
  // Add plan type if specified
  if (job.planType === 'location-plan') {
    args.push('--detailed')
  }
  
  console.log(`Starting OSM conversion for job ${jobId}:`, args.join(' '))
  
  // Spawn Python process
  const pythonProcess = spawn('python', args, {
    stdio: ['pipe', 'pipe', 'pipe']
  })
  
  let stdout = ''
  let stderr = ''
  
  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString()
    console.log(`OSM Conversion stdout: ${data}`)
    
    // Update progress based on output
    if (data.toString().includes('Processing nodes')) {
      job.progress = 30
      job.message = 'Processing OSM nodes...'
    } else if (data.toString().includes('Processing ways')) {
      job.progress = 60
      job.message = 'Processing OSM ways...'
    } else if (data.toString().includes('Generating DXF')) {
      job.progress = 80
      job.message = 'Generating DXF file...'
    }
  })
  
  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString()
    console.error(`OSM Conversion stderr: ${data}`)
  })
  
  pythonProcess.on('close', (code) => {
    console.log(`OSM conversion process exited with code ${code}`)
    
    if (code === 0) {
      // Success
      job.status = 'completed'
      job.progress = 100
      job.message = 'Conversion completed successfully'
      job.outputFile = outputFile
      
      // Try to extract stats from stdout
       const nodeMatch = stdout.match(/Processed (\d+) nodes/)
       const wayMatch = stdout.match(/Processed (\d+) ways/)
       const layerMatch = stdout.match(/(\d+) layers created/)
      
      job.stats = {
        nodes: nodeMatch ? parseInt(nodeMatch[1]) : 0,
        ways: wayMatch ? parseInt(wayMatch[1]) : 0,
        layers: layerMatch ? parseInt(layerMatch[1]) : 0
      }
      
    } else {
      // Error
      job.status = 'error'
      job.progress = 0
      job.message = `Conversion failed: ${stderr || 'Unknown error'}`
      console.error(`OSM conversion failed for job ${jobId}:`, stderr)
    }
  })
  
  pythonProcess.on('error', (error) => {
    console.error(`Failed to start OSM conversion process:`, error)
    job.status = 'error'
    job.progress = 0
    job.message = `Failed to start conversion: ${error.message}`
  })
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DrafTeam API server running on port ${PORT}`)
  console.log(`📊 Dashboard: http://localhost:3000`)
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message)
    } else {
      console.log('📦 Database connection closed.')
    }
    process.exit(0)
  })
})