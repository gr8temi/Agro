import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your machine's IP address if testing on physical device
// For Android Emulator use 'http://10.0.2.2:8000/api'
// For iOS Simulator use 'http://localhost:8000/api'
const BASE_URL = 'https://56eaa7272004.ngrok-free.app/api'; 

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
