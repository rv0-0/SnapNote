# SnapNote Daily One-Minute Journal Platform

## Overview
This is a full-stack application for a daily journaling platform that encourages users to write for exactly 60 seconds per day. The platform is built with a clear separation between backend and frontend.

## Architecture
- **Backend**: Node.js + Express + MongoDB + JWT Authentication
- **Frontend**: React + TypeScript + Tailwind CSS
- **Security**: JWT tokens, MFA support, rate limiting, password hashing
- **Features**: 60-second timer, daily entries, export functionality, mood tracking

## Key Directories

### Backend (`/backend`)
- `src/models/` - Mongoose schemas for User and JournalEntry
- `src/controllers/` - Business logic for auth, journal, and user operations
- `src/routes/` - API route definitions with validation
- `src/middleware/` - Authentication and error handling middleware
- `src/utils/` - Helper functions for JWT, validation, etc.

### Frontend (`/frontend`)
- `src/components/` - Reusable UI components (Button, Input, LoadingSpinner)
- `src/pages/` - Page components (Landing, Login, Register, Dashboard, Write, Settings)
- `src/context/` - React context for authentication state management
- `src/services/` - API service layer with axios and token management
- `src/hooks/` - Custom React hooks (useTimer for 60-second countdown)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Frontend utility functions (date formatting, validation, etc.)

## Core Features Implemented

### Authentication & Security
- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt
- Rate limiting for API endpoints
- MFA setup and verification infrastructure
- Account lockout after failed attempts

### Journal Functionality
- 60-second timer that starts when typing begins
- Daily entry restriction (one entry per day)
- Mood tracking with emoji selection
- Word count and character count tracking
- Entry statistics and streak calculation

### User Management
- User registration and login
- Profile management and preferences
- Password change functionality
- Data export (JSON format)
- Account deletion with confirmation

## Design Patterns Used
- Repository pattern for data access
- Context API for state management
- Custom hooks for reusable logic
- Error boundaries and proper error handling
- Responsive design with Tailwind CSS
- Type-safe API layer with TypeScript

## Security Measures
- CORS configuration
- Helmet for security headers
- Input validation and sanitization
- SQL injection prevention through Mongoose
- XSS protection through input sanitization
- Rate limiting for auth endpoints

## Development Guidelines
- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Implement proper error handling throughout
- Use consistent naming conventions
- Comment complex business logic
- Validate inputs on both client and server

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login with optional MFA
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/journal/entries` - Create journal entry (rate limited to 1/day)
- `GET /api/journal/entries` - Get journal entries with pagination
- `GET /api/journal/stats` - Get user statistics
- `PUT /api/user/preferences` - Update user preferences
- `GET /api/user/export` - Export user data

## Future Enhancements
- PDF export functionality
- Email reminder system
- Offline mode with sync
- Dark/light theme implementation
- Calendar view improvements
- Mobile app development
