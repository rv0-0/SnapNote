# SnapNote - Daily One-Minute Journal

A secure and user-friendly journal platform that encourages users to reflect daily for just one minute. Build consistent writing habits without the pressure of lengthy entries.

## 🌟 Features

### Core Functionality
- **60-Second Timer**: Write for exactly one minute - timer starts when you begin typing
- **Daily Lock**: One entry per day prevents overwhelming yourself
- **Secure Authentication**: JWT-based auth with optional two-factor authentication
- **Mood Tracking**: Track your emotional state with each entry
- **Export Options**: Download your journal entries as JSON (PDF coming soon)
- **Statistics**: View your writing streak, word counts, and progress over time
- **Dark Theme**: Full dark mode support with automatic system preference detection
- **Smooth Transitions**: Beautiful UI transitions between light and dark themes

### Security Features
- Password hashing with bcrypt
- JWT access and refresh tokens
- Rate limiting and CAPTCHA protection
- Account lockout after failed attempts
- CORS and security headers
- Optional MFA with TOTP

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- RESTful API with proper validation
- JWT authentication with refresh tokens
- Rate limiting for security
- Comprehensive error handling
- Data export functionality

### Frontend (React + TypeScript + Tailwind CSS)
- Responsive design for all devices
- Real-time 60-second timer
- Type-safe API integration
- Modern UI with smooth animations
- Progressive web app capabilities

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SnapNote
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env` and update the values:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/snapnote-journal
   JWT_ACCESS_SECRET=your-super-secret-access-token
   JWT_REFRESH_SECRET=your-super-secret-refresh-token
   JWT_ACCESS_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   BCRYPT_ROUNDS=12
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the Application**
   
   Backend (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 📁 Project Structure

```
SnapNote/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API endpoints
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Express app setup
│   ├── .env                 # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript definitions
│   │   ├── utils/           # Helper functions
│   │   └── App.tsx          # Main app component
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA
- `POST /api/auth/mfa/disable` - Disable MFA

### Journal Entries
- `POST /api/journal/entries` - Create new entry (1 per day limit)
- `GET /api/journal/entries` - Get entries with pagination
- `GET /api/journal/entries/:id` - Get specific entry
- `GET /api/journal/stats` - Get user statistics
- `GET /api/journal/can-write-today` - Check if user can write today
- `GET /api/journal/calendar` - Get calendar data

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/preferences` - Update preferences
- `PUT /api/user/password` - Change password
- `GET /api/user/export` - Export user data
- `DELETE /api/user/account` - Delete account

## 🎨 Key Components

### Timer Hook (`useTimer`)
Custom React hook that manages the 60-second countdown timer with start, pause, and completion functionality.

### API Service Layer
Type-safe API client with automatic token refresh, error handling, and request/response interceptors.

### Authentication Context
React context providing authentication state management across the application.

### Security Middleware
- Rate limiting for auth endpoints
- Input validation and sanitization
- JWT token verification
- Error handling with appropriate HTTP status codes

## 🔒 Security Considerations

- **Input Validation**: All inputs validated on both client and server
- **SQL Injection**: Prevented through Mongoose ODM
- **XSS Protection**: Input sanitization and CSP headers
- **CSRF Protection**: SameSite cookies and CORS configuration
- **Rate Limiting**: Prevents brute force attacks
- **Password Security**: Bcrypt hashing with configurable rounds
- **Token Security**: Short-lived access tokens with secure refresh mechanism

## 🎯 Usage

1. **Registration**: Create an account with email and secure password
2. **Login**: Sign in with optional two-factor authentication
3. **Daily Writing**: Click "Start Writing" and express your thoughts for 60 seconds
4. **Mood Tracking**: Select your mood after writing
5. **Review**: View your past entries and track your progress
6. **Export**: Download your data for backup or analysis

## 🚧 Future Enhancements

- [ ] PDF export functionality
- [ ] Email reminder system
- [ ] Offline mode with sync capability
- [ ] Mobile application
- [ ] AI-powered insights and mood analysis
- [ ] Social features (optional sharing)
- [ ] Multiple journal templates
- [ ] Voice-to-text input
- [ ] Calendar integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the power of daily habits and reflection
- Built with modern web technologies for optimal user experience
- Designed with privacy and security as top priorities

---

**Start your journaling journey today - one minute at a time! ✍️**
