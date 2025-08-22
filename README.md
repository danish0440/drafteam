# 🏗️ DrafTeam - Professional Drafting & Project Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

## 📋 Overview

DrafTeam is a comprehensive web-based platform designed for professional drafting teams and project management. It combines modern web technologies with powerful features for managing drafting projects, team collaboration, and technical documentation.

## ✨ Features

### 🎯 Core Features
- **Project Management**: Complete project lifecycle management with status tracking
- **Team Collaboration**: Team member management and role-based access
- **Dashboard Analytics**: Real-time project insights and progress tracking
- **File Management**: Secure file upload and document management
- **Reporting System**: Comprehensive project reports and analytics

### 🔧 Technical Features
- **AI-Powered Drawing Checker**: Automated drawing validation and quality control
- **PDF Converter**: Advanced PDF processing and conversion tools
- **OSM to DXF Converter**: OpenStreetMap data conversion to DXF format
- **Voice Integration**: Voice commands and audio processing
- **Real-time Updates**: Live project status updates

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Dark/Light Mode**: Customizable theme preferences
- **Mobile Responsive**: Optimized for all device sizes
- **Intuitive Navigation**: User-friendly sidebar navigation

## 🛠️ Technology Stack

### Frontend
- **React 18+** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **SQLite** - Lightweight database
- **Python** - For specialized processing tasks

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/danish0440/drafteam.git
   cd drafteam
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp server/.env.example server/.env
   
   # Edit environment variables as needed
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm start
   
   # Terminal 2: Start frontend development server
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/api/health

## 🐳 Docker Deployment

### Development Environment
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production Environment
```bash
docker-compose up -d
```

## 📁 Project Structure

```
drafteam/
├── src/                    # Frontend source code
│   ├── components/         # Reusable React components
│   ├── pages/             # Application pages
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── server/                # Backend source code
│   ├── database/          # SQLite database
│   ├── uploads/           # File upload directory
│   └── index.js           # Main server file
├── public/                # Static assets
├── docker-compose.yml     # Production Docker config
├── docker-compose.dev.yml # Development Docker config
├── nginx.conf            # Nginx configuration
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

**Backend (server/.env)**
```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database/drafttracker.db
# Add your API keys here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 📊 API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Team Members
- `GET /api/team-members` - Get all team members
- `POST /api/team-members` - Add team member

### Files
- `POST /api/upload` - Upload files
- `GET /api/files/:id` - Download file

### Health Check
- `GET /api/health` - API health status

## 🔒 Security Features

- Environment variable protection
- File upload validation
- SQL injection prevention
- CORS configuration
- Input sanitization
- Secure file handling

## 🚀 Production Deployment

### VPS Deployment with Nginx

1. **Server Setup**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Nginx
   sudo apt update
   sudo apt install nginx
   ```

2. **Deploy Application**
   ```bash
   git clone https://github.com/danish0440/drafteam.git
   cd drafteam
   
   # Configure environment variables
   cp .env.example .env
   cp server/.env.example server/.env
   # Edit .env files with production values
   
   # Start with Docker Compose
   docker-compose up -d
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **SSL Setup**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server
npm test
```

## 📈 Performance

- **Frontend**: Vite for fast builds and HMR
- **Backend**: Express.js with optimized middleware
- **Database**: SQLite with connection pooling
- **Caching**: Static asset caching with Nginx
- **Compression**: Gzip compression enabled

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead**: Danish Ahmad
- **GitHub**: [@danish0440](https://github.com/danish0440)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@drafteam.com
- Documentation: [Wiki](https://github.com/danish0440/drafteam/wiki)

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Real-time collaboration
- [ ] Integration with CAD software
- [ ] Advanced reporting dashboard
- [ ] Multi-language support

---

**Made with ❤️ by the DrafTeam**

*Professional drafting solutions for modern teams*