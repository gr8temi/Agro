import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Override in .env.local (e.g. EXPO_PUBLIC_API_URL=http://192.168.1.10:8001/api) to use a
// local backend. Restart `expo start` after changing it; values are inlined at bundle time.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://farm.api.pinowo.com/api';

const client = axios.create({
  baseURL: BASE_URL,
});

let _onAuthFailure = null;

export const setOnAuthFailure = (callback) => {
  _onAuthFailure = callback;
};

client.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        await SecureStore.setItemAsync('userToken', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);

        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only end the session when the refresh token is actually rejected (or missing).
        // Network errors and 5xx keep the session so the user isn't logged out offline.
        const status = refreshError.response?.status;
        const noRefreshToken = refreshError.message === 'No refresh token';
        if (noRefreshToken || status === 401 || status === 403) {
          await SecureStore.deleteItemAsync('userToken');
          await SecureStore.deleteItemAsync('refreshToken');
          if (_onAuthFailure) _onAuthFailure();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
