# InnoCheck - Quick Start Guide

## 5-Minute Setup

### 1. Backend (Terminal 1)
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
pip install -r requirements.txt
python main_app.py
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm start
```

### 3. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Required API Keys
Get these and add to `backend/.env`:
- **OpenAI**: https://platform.openai.com/api-keys
- **Google AI**: https://aistudio.google.com/apikey

## Test the Features
1. **Idea Validator** - Enter a hackathon idea
2. **Code Generator** - Describe an app to generate code
3. **Plagiarism Checker** - Check text for similarity
4. **Literature Review** - Search academic papers
5. **Prototype Builder** - Create a web prototype

## Need Help?
See `README_SETUP.md` for detailed instructions.
