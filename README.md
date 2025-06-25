# Event Management App

A full-stack event management application built with React Native (Expo), GraphQL backend, and PostgreSQL database.

## 🏗️ Project Structure

- **backend/**: Node.js GraphQL server with Prisma ORM
- **EventApp/**: React Native mobile app built with Expo

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go app](https://expo.dev/client) on your physical device

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventsdb"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000
```

### 4. Start Database with Docker
```bash
docker-compose up --build -d
```

### 5. Setup Database Schema
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Open Prisma Studio to manage your database
npx prisma studio

```

### 6. Start Backend Server
```bash
# Development mode
npm run dev

# Or build and start
npm run build
npm start
```

The GraphQL server will be available at `http://localhost:4000/graphql`

## 📱 Frontend Setup (React Native with Expo)

### 1. Navigate to Frontend Directory
```bash
cd EventApp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the EventApp directory:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4000/graphql
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LOCAL_IP:4000
```

**Important**: Replace `YOUR_LOCAL_IP` with your computer's local IP address (e.g., `192.168.1.100`). You can find this by running `ipconfig` on Windows.

### 4. Start Expo Development Server
```bash
npx expo start
```

## 📲 Testing on Physical Device

### Method 1: Using Expo Go App (Recommended)

1. **Install Expo Go**:
   - Download and install [Expo Go](https://expo.dev/client) from App Store (iOS) or Google Play Store (Android)

2. **Connect to Same Network**:
   - Ensure your phone and computer are on the same Wi-Fi network

3. **Start the App**:
   ```bash
   cd EventApp
   npx expo start
   ```

4. **Scan QR Code**:
   - Open Expo Go app on your phone
   - Scan the QR code displayed in the terminal or browser
   - The app will load on your device

### Method 2: Direct Device Connection

For Android:
```bash
npx expo start --android
```

For iOS:
```bash
npx expo start --ios
```
## 🔍 API Testing

You can test the GraphQL API using:

1. **Sample Queries**:
   ```graphql
   # Get all events
   query {
     events {
       id
       title
       description
       startTime
       creator {
         username
       }
     }
   }
   
   # Create a new user
   mutation {
     register(input: {
       username: "testuser"
       email: "test@example.com"
       password: "password123"
     }) {
       token
       user {
         id
         username
         email
       }
     }
   }
   ```

## 📱 App Features

- **User Authentication**: Register and login
- **Event Management**: Create, view, and manage events
- **Real-time Updates**: Socket.io integration for live updates
- **Responsive Design**: Optimized for mobile devices

## 🛠️ Development Commands

### Backend
```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Database operations
npx prisma studio          # Open database browser
npx prisma migrate dev      # Create and apply new migration
npx prisma generate         # Regenerate Prisma client
```

### Frontend
```bash
# Start development server
npx expo start

# Start with specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Clear cache
npx expo start --clear

# Check for issues
npx expo doctor
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Ensure Docker is running
   - Check if PostgreSQL container is healthy: `docker-compose ps`

2. **Expo App Not Loading**:
   - Verify both devices are on the same network
   - Check if the API URL in `.env` uses your local IP address
   - Try clearing Expo cache: `npx expo start --clear`

3. **GraphQL Errors**:
   - Ensure backend server is running on port 4000
   - Check database migrations are applied
   - Verify environment variables are set correctly

4. **Metro Bundler Issues**:
   ```bash
   # Clear React Native cache
   npx expo start --clear
   
   # Reset project
   npm run reset-project
   ```

### Getting Your Local IP Address

**Windows**:
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**macOS/Linux**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 📚 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Apollo Server** - GraphQL server
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Docker** - Containerization

### Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform
- **Apollo Client** - GraphQL client
- **Zustand** - State management
- **Socket.io Client** - Real-time updates
- **React Navigation** - Navigation
- **Tanstack Query** - Data fetching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
