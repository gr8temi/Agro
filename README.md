# Poultry Farm Manager - Mobile App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React Native mobile application for managing poultry farm operations on iOS and Android devices. Built with Expo for seamless development and deployment.

## Features

- **Farm Management**: Create and join farms using unique farm codes
- **User Authentication**: Secure login with JWT tokens and biometric authentication
- **Flock Tracking**: Monitor and manage poultry flocks
- **Financial Management**: Track expenses and revenue
- **User Management**: Invite and manage farm staff with role-based permissions
- **Password Reset**: Secure password recovery with email verification
- **Reminders**: Set local notifications for feeding, medication, and other tasks
- **Settings**: Manage account preferences and security settings
- **Offline Support**: Secure local storage with expo-secure-store
- **Biometric Auth**: Face ID/Touch ID support via expo-local-authentication

## Tech Stack

- **Framework**: React Native (0.81.5)
- **Runtime**: Expo (~54.0.25)
- **Navigation**: React Navigation 7.x
- **State Management**: React Context API & Async Storage
- **HTTP Client**: Axios
- **UI Components**: React Native core components
- **Notifications**: expo-notifications
- **Authentication**: expo-local-authentication, expo-secure-store

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on physical devices)
- iOS Simulator (Mac only) or Android Studio Emulator

## Installation

1. Clone the repository and navigate to the mobile directory:
   ```bash
   cd /path/to/gemini/mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the backend URL:
   - Update the API base URL in your API configuration file
   - Default: `http://localhost:8000` (for local development)

4. Start the Expo development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   ```bash
   npm run ios       # iOS Simulator
   npm run android   # Android Emulator
   npm run web       # Web Browser
   ```

## Project Structure

```
mobile/
├── assets/               # Images, icons, and static files
├── src/
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # App screens
│   │   ├── LoginScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── SettingsScreen.js
│   │   └── ...
│   ├── services/         # API services and utilities
│   └── utils/            # Helper functions
├── App.js                # App entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Key Screens

- **Login/Registration**: User authentication and farm creation
- **Home Dashboard**: Overview of farm operations
- **Flock Management**: Add, edit, and monitor flocks
- **Financial Tracking**: Record and view transactions
- **User Management**: Invite and manage team members
- **Settings**: Account and app preferences
- **Reminders**: Schedule notifications for tasks

## Configuration

### API Base URL

Update the API endpoint in your service configuration:

```javascript
const API_BASE_URL = 'http://your-backend-url:8000';
```

For local development with a physical device:
- iOS: Use your computer's local IP address
- Android Emulator: Use `10.0.2.2` instead of `localhost`

### Notifications

Local notifications are configured to work in the background. Ensure you grant notification permissions when prompted.

```javascript
// Request permissions in app initialization
import * as Notifications from 'expo-notifications';

await Notifications.requestPermissionsAsync();
```

## Development

### Running on Physical Device

1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Start the dev server: `npm start`
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Debugging

- Shake device to open developer menu
- Enable Remote JS Debugging or use Reactotron
- View logs with `npx react-native log-ios` or `npx react-native log-android`

### Building for Production

For iOS:
```bash
expo build:ios
```

For Android:
```bash
expo build:android
```

## Environment Variables

Create a `.env` file (if using expo-constants or similar):

```
API_BASE_URL=https://your-production-api.com
```

## Permissions

The app requires the following permissions:

- **Notifications**: For task reminders
- **Biometric**: For secure authentication (optional)
- **Network**: For API communication

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache and restart
npm start -- --reset-cache
```

### iOS Build Issues

```bash
cd ios
pod install
cd ..
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Dependencies

Major dependencies include:

- `react-native`: Core framework
- `expo`: Development platform
- `@react-navigation/native`: Navigation
- `axios`: HTTP client
- `expo-notifications`: Push notifications
- `expo-secure-store`: Secure storage
- `expo-local-authentication`: Biometric auth
- `react-native-toast-message`: Toast notifications

See [package.json](package.json) for the complete list.

## Support

For issues, questions, or contributions, please open an issue on the repository.

## Roadmap

- [ ] Dark mode support
- [ ] Offline mode with sync
- [ ] Export financial reports
- [ ] Multi-language support
- [ ] Push notifications from backend
