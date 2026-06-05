# InnoCheck Frontend

AI-powered Hackathon Innovation Suite Frontend Application

## 🚀 Features Implemented

### ✅ Complete UI Components
- **Dashboard** - Home page with metrics and feature cards
- **Idea Validator** - Problem statement input with innovation gap analysis
- **Code Generator** - NL to code conversion with framework selection
- **Plagiarism Checker** - Text/code checking against multiple sources
- **Literature Review** - Academic paper search and bibliography generation
- **Prototype Builder** - Rapid prototype creation with live preview

### ✅ Layout Components
- **Sidebar Navigation** - Complete navigation with recent projects
- **Header** - Search bar, notifications, and user profile
- **Responsive Design** - Mobile, tablet, and desktop layouts

### ✅ Technical Implementation
- **React 18** with modern hooks and patterns
- **Tailwind CSS** for responsive, utility-first styling
- **TypeScript** support with proper type definitions
- **Axios** for API integration with interceptors
- **Heroicons** for consistent iconography
- **React Router** for client-side routing

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running on port 8000

### Installation Steps

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Layout.jsx
│   │   └── Features/
│   │       ├── Dashboard.jsx
│   │       ├── IdeaValidator.jsx
│   │       ├── CodeGenerator.jsx
│   │       ├── PlagiarismChecker.jsx
│   │       ├── LiteratureReview.jsx
│   │       └── PrototypeBuilder.jsx
│   ├── pages/
│   │   └── Dashboard.jsx
│   ├── services/
│   │   └── api.js
│   ├── styles/
│   │   └── globals.css
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

## 🎨 UI/UX Features

### Dashboard
- **Metrics Cards** - Real-time statistics with trend indicators
- **Feature Cards** - Interactive cards with gradients and hover effects
- **Responsive Grid** - Adapts to different screen sizes
- **Quick Actions** - Easy access to all features

### Idea Validator
- **Multi-language Support** - English, Hindi, Marathi
- **Source Selection** - arXiv, GitHub, Devpost, Semantic Scholar
- **Real-time Analysis** - Innovation score and gap analysis
- **File Upload** - PDF/DOCX support

### Code Generator
- **Framework Selection** - React, Vue, Flask, FastAPI, HTML/CSS
- **Code Options** - Comments, TypeScript, Responsive design
- **Live Preview** - Syntax-highlighted code display
- **Export Options** - Copy to clipboard, download as ZIP

### Plagiarism Checker
- **Source Selection** - Toggle between different databases
- **Similarity Scoring** - Color-coded results
- **Matched Sources** - Detailed source information
- **Highlighted Text** - Visual plagiarism indicators

### Literature Review
- **Advanced Search** - Keywords, year range, sorting
- **Paper Management** - Save papers to library
- **Bibliography Export** - IEEE format export
- **Source Filtering** - Multiple academic databases

### Prototype Builder
- **Template Selection** - Blank, Landing Page, Dashboard, Form, E-commerce
- **Color Schemes** - Light, Dark, Brand themes
- **Device Preview** - Desktop, Tablet, Mobile views
- **Live Preview** - Real-time iframe rendering
- **Code View** - HTML/CSS/JS code display

## 🔧 API Integration

The frontend is fully integrated with the backend API through a centralized service:

```javascript
import { apiService } from './services/api';

// Example usage
const result = await apiService.ideaValidator.validateIdea(data);
const papers = await apiService.literatureReview.searchPapers(query);
```

### Available Endpoints
- `/api/auth/*` - Authentication
- `/api/validate/*` - Idea validation
- `/api/generate/*` - Code generation
- `/api/plagiarism/*` - Plagiarism checking
- `/api/literature/*` - Literature review
- `/api/prototype/*` - Prototype building

## 🎯 Key Features

### Responsive Design
- Mobile-first approach
- Breakpoint-based layouts
- Touch-friendly interactions
- Adaptive navigation

### Performance Optimizations
- Code splitting
- Lazy loading
- Optimized assets
- Efficient re-renders

### User Experience
- Smooth transitions
- Loading states
- Error handling
- Intuitive navigation

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

## 🚀 Getting Started

1. **Start Backend API**
   ```bash
   cd backend
   python -m uvicorn app:app --reload
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🎨 Customization

### Colors & Themes
Edit `tailwind.config.js` to customize:
- Primary colors
- Gradient combinations
- Font families
- Spacing scales

### Components
All components are modular and reusable:
- Edit individual components in `/src/components/`
- Shared styles in `/src/styles/`
- API services in `/src/services/`

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the backend API status
2. Verify environment configuration
3. Check browser console for errors
4. Review API integration in `services/api.js`

---

**Note**: This frontend is designed to work with the InnoCheck backend API. Make sure the backend is running and properly configured before starting the frontend.
