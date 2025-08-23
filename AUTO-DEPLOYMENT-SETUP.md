# 🚀 Auto-Deployment Setup Guide for DrafTeam

This guide will help you set up automatic deployment so your VPS updates automatically when you push changes to GitHub, and resolve differences between development and production environments.

## 🎯 Problem Solution

**Your Issue**: Development works but production has errors + manual deployment
**Solution**: Automated CI/CD pipeline + Environment consistency

---

## 📋 Step 1: Setup GitHub Secrets

1. Go to your GitHub repository: `https://github.com/danish0440/drafteam`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

```
VPS_HOST = 109.123.238.224
VPS_USERNAME = root
VPS_PASSWORD = drafteamprofinity
```

---

## 🔧 Step 2: Setup VPS for Auto-Deployment

SSH to your VPS and run these commands:

```bash
# SSH to your VPS
ssh root@109.123.238.224

# Navigate to your project directory
cd /opt/drafteam

# Pull the latest changes (includes new auto-deploy files)
git pull origin main

# Make deployment script executable
chmod +x auto-deploy.sh

# Copy production environment files
cp .env.production .env
cp server/.env.production server/.env

# Edit environment files with your actual API keys
nano .env
nano server/.env
```

### Important: Update Environment Variables

Edit these files and replace placeholder values:

**In `.env`:**
```bash
# Update these with your actual values
OPENAI_API_KEY=your_actual_openai_key
GOOGLE_MAPS_API_KEY=your_actual_google_maps_key
JWT_SECRET=your_super_secure_random_string
```

**In `server/.env`:**
```bash
# Update these with your actual values
OPENAI_API_KEY=your_actual_openai_key
GOOGLE_MAPS_API_KEY=your_actual_google_maps_key
JWT_SECRET=your_super_secure_random_string
SESSION_SECRET=another_secure_random_string
```

---

## 🔄 Step 3: Test Auto-Deployment

### Manual Test First:
```bash
# On your VPS, test the auto-deploy script
cd /opt/drafteam
./auto-deploy.sh
```

### GitHub Actions Test:
1. Make any small change to your code locally
2. Commit and push to main branch:
```bash
git add .
git commit -m "Test auto-deployment"
git push origin main
```
3. Check GitHub Actions tab in your repository
4. Wait 2-3 minutes and check your website

---

## 🛠️ Step 4: Fix Development vs Production Differences

### Common Issues & Solutions:

#### 1. **API URL Differences**
- **Development**: `http://localhost:3001`
- **Production**: `https://drafteam.space/api`
- **Solution**: Environment variables handle this automatically

#### 2. **Database Path Issues**
- **Development**: Local SQLite file
- **Production**: Docker volume mounted SQLite
- **Solution**: Production environment uses `/app/data/drafttracker.db`

#### 3. **File Upload Paths**
- **Development**: Local uploads folder
- **Production**: Docker volume mounted uploads
- **Solution**: Production environment uses `/app/uploads`

#### 4. **HTTPS vs HTTP**
- **Development**: HTTP only
- **Production**: HTTPS with SSL
- **Solution**: Environment variables configure secure cookies and HTTPS redirects

#### 5. **Missing API Keys**
- **Issue**: Features work in dev but fail in production
- **Solution**: Ensure all API keys are properly set in production `.env` files

---

## 📊 Step 5: Monitor and Debug

### Check Deployment Status:
```bash
# SSH to VPS
ssh root@109.123.238.224

# Check deployment logs
tail -f /var/log/drafteam-deploy.log

# Check container status
cd /opt/drafteam
docker-compose -f docker-compose.prod.yml ps

# Check container logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Debug Common Issues:

#### Backend API Errors:
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Test API directly
curl http://localhost:3001/api/health
```

#### Frontend Build Errors:
```bash
# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Rebuild frontend only
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

#### Database Issues:
```bash
# Check database volume
docker volume ls | grep drafteam

# Access database container
docker exec -it drafteam-backend bash
ls -la /app/data/
```

---

## 🔄 Workflow Summary

### Now Your Workflow Is:

1. **Develop Locally**:
   ```bash
   cd C:\githubproject\drafteam\drafteam
   npm start  # Test locally
   ```

2. **Push Changes**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

3. **Automatic Deployment**:
   - GitHub Actions triggers automatically
   - VPS pulls latest code
   - Rebuilds and restarts containers
   - Performs health checks
   - Rolls back if deployment fails

4. **Verify**:
   - Check https://drafteam.space
   - Monitor logs if needed

---

## 🚨 Emergency Procedures

### If Deployment Fails:
```bash
# SSH to VPS
ssh root@109.123.238.224

# Check what went wrong
tail -50 /var/log/drafteam-deploy.log

# Manual rollback to previous version
cd /opt/drafteam-backups
ls -la  # Find latest backup
# Restore manually if needed
```

### If Website is Down:
```bash
# Quick restart
cd /opt/drafteam
docker-compose -f docker-compose.prod.yml restart

# Full rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Benefits of This Setup

- ✅ **Automatic Deployment**: Push to GitHub → Auto-deploy to VPS
- ✅ **Environment Consistency**: Same config between dev and prod
- ✅ **Backup & Rollback**: Automatic backups before each deployment
- ✅ **Health Checks**: Ensures deployment succeeded
- ✅ **Error Logging**: Detailed logs for debugging
- ✅ **Zero Downtime**: Graceful container restarts

---

## 🎉 You're All Set!

Now you can:
1. Develop and test locally
2. Push changes to GitHub
3. Watch them automatically deploy to production
4. Have confidence that production matches development

Your website will stay in sync and errors should be minimized! 🚀