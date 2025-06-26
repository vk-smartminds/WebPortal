# VK WebPortal

## Setup Instructions

### 1. Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Server
   PORT=8000
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   
   # Email (Gmail)
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

4. **Start the backend server:**
   ```bash
   npm start
   ```

### 2. Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

---

- Make sure the backend is running before using the frontend.
- Place your `default-avatar.png` in the `frontend/public/` folder for the default profile picture.
