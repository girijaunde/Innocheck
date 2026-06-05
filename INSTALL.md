# Installation Guide

## Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Step 1: Create Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

## Step 2: Install Dependencies

```bash
# Upgrade pip first
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

## Step 3: Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./innocheck.db

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# API Keys (Optional - for enhanced features)
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Rate Limiting
REDIS_URL=redis://localhost:6379
```

## Step 4: Run Backend

```bash
# Start the server
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Step 5: Run Frontend (Separate Terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Troubleshooting

### Common Issues

1. **Dependency Conflicts**
   - Ensure you're using Python 3.11
   - Always use a fresh virtual environment
   - Upgrade pip before installing

2. **Import Errors**
   - Check if all dependencies installed correctly
   - Verify virtual environment is activated

3. **Database Connection Issues**
   - Default uses SQLite (no setup required)
   - For PostgreSQL, install psycopg2-binary and update DATABASE_URL

4. **API Key Errors**
   - API keys are optional for basic functionality
   - For AI features, add OPENAI_API_KEY and GEMINI_API_KEY

### Clean Installation

If you encounter issues, start fresh:

```bash
# Remove existing virtual environment
rm -rf venv

# Create new one
python -m venv venv
venv\Scripts\activate  # or source venv/bin/activate

# Install
pip install --upgrade pip
pip install -r requirements.txt
```

## Dependency Notes

The fixed requirements.txt includes:
- **FastAPI Stack**: v0.109.0 (stable, compatible)
- **LangChain Ecosystem**: v0.0.350 (compatible with community packages)
- **AI/ML Libraries**: Tested compatible versions
- **Database**: SQLAlchemy 2.0.23 with PostgreSQL support
- **Security**: Latest stable authentication packages

All dependencies are tested for Python 3.11 compatibility.
