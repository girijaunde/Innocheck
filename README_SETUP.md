# InnoCheck - Complete Setup Guide

## Overview
InnoCheck is an AI-powered platform for hackathon participants with 5 main features:
1. **Idea Validator** - Validates hackathon idea novelty
2. **Code Generator** - Converts natural language to functional code
3. **Plagiarism Checker** - Checks text/code against 400M+ sources
4. **Literature Review** - Searches academic papers and generates bibliography
5. **Prototype Builder** - Generates rapid prototypes with live preview

## System Requirements
- **Python 3.8+** for backend
- **Node.js 16+** for frontend
- **Git** for version control
- **API Keys** for AI features (OpenAI, Google AI, etc.)

## Quick Start

### 1. Backend Setup

```bash
# Navigate to project directory
cd Inoocheck

# Copy environment file
cp backend/.env.example backend/.env

# Edit .env with your API keys
# OPENAI_API_KEY=your_openai_key
# GOOGLE_API_KEY=your_google_key
# GEMINI_API_KEY=your_gemini_key

# Install Python dependencies
pip install -r backend/requirements.txt

# Start backend server
python start_backend.py
```

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### 2. Frontend Setup

**For Windows:**
```bash
# From project root
start_frontend.bat
```

**For Mac/Linux:**
```bash
# From project root
chmod +x start_frontend.sh
./start_frontend.sh
```

**Manual Setup:**
```bash
cd frontend
npm install
npm start
```

Frontend will be available at: http://localhost:3000

### 3. Access the Application

1. Open your browser
2. Go to http://localhost:3000
3. The InnoCheck dashboard will load

## API Configuration

### Required API Keys

1. **OpenAI API Key** (for GPT-3.5/GPT-4)
   - Get from: https://platform.openai.com/api-keys
   - Add to .env: `OPENAI_API_KEY=your_key_here`

2. **Google AI Key** (for Gemini)
   - Get from: https://aistudio.google.com/apikey
   - Add to .env: `GOOGLE_API_KEY=your_key_here`

3. **Gemini API Key** (alternative AI)
   - Get from: https://aistudio.google.com/apikey
   - Add to .env: `GEMINI_API_KEY=your_key_here`

### Optional API Keys

- **GitHub Token** - For enhanced code search
- **Semantic Scholar API Key** - For academic paper search
- **arXiv API Key** - For research paper access

## Features Overview

### 1. Idea Validator
- Input your hackathon problem statement
- Get innovation score (0-100)
- Receive gap analysis and recommendations
- Compare against existing projects

### 2. Code Generator
- Describe your app in natural language
- Choose framework: React, Vue, Flask, FastAPI, HTML
- Get functional code with comments
- Copy or download generated code

### 3. Plagiarism Checker
- Paste text or code to check
- Select sources: Devpost, GitHub, arXiv, Semantic Scholar
- Get similarity percentage and matched sources
- Highlighted plagiarism detection

### 4. Literature Review
- Search 590M+ academic papers
- Filter by year and source
- Save papers to personal library
- Export bibliography in IEEE format

### 5. Prototype Builder
- Describe your prototype idea
- Choose template: Landing Page, Dashboard, Form, E-commerce
- Select color scheme: Light, Dark, Brand
- Live preview with device switching

## Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and stop existing process (Windows)
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

**ModuleNotFoundError:**
```bash
# Install missing dependencies
pip install -r requirements.txt
```

**API Key errors:**
- Check .env file exists in backend directory
- Verify API keys are correct
- Check internet connection

### Frontend Issues

**Port 3000 already in use:**
```bash
# Kill existing process
npx kill-port 3000
# Or use different port
PORT=3001 npm start
```

**Node modules issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Ensure backend is running on port 8000
- Check frontend .env has correct API_URL

### Database Issues

**SQLite database not found:**
- Database is created automatically on first run
- Check backend directory for innocheck.db

**Permission errors:**
- Run backend with appropriate permissions
- Check file system permissions

## Development

### Backend Development
```bash
cd backend
python main_app.py
# API docs at http://localhost:8000/docs
```

### Frontend Development
```bash
cd frontend
npm start
# Development server with hot reload
```

### Project Structure
```
Inoocheck/
âââ backend/
â   âââ main_app.py          # FastAPI application
â   âââ requirements.txt     # Python dependencies
â   âââ .env.example        # Environment template
â   âââ innocheck.db        # SQLite database (auto-created)
â
âââ frontend/
â   âââ src/
â   â   âââ components/     # React components
â   â   âââ services/        # API integration
â   â   âââ pages/           # Page components
â   âââ package.json        # Node.js dependencies
â   âââ public/             # Static files
â
âââ start_backend.py        # Backend startup script
âââ start_frontend.bat     # Windows frontend script
âââ start_frontend.sh      # Mac/Linux frontend script
```

## Production Deployment

### Backend Production
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main_app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Production
```bash
# Build for production
npm run build

# Serve static files
npx serve -s build -l 3000
```

## Support

For issues and questions:
1. Check this README first
2. Verify all API keys are configured
3. Ensure both backend and frontend are running
4. Check browser console for errors
5. Review API documentation at http://localhost:8000/docs

## License

This project is licensed under the MIT License.

---

**Note**: This is a complete full-stack application. Both backend and frontend must be running for full functionality.
