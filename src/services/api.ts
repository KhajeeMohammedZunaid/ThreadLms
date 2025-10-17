/**
 * Core API Service
 * Configured axios instance with interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_TIMEOUT, STORAGE_KEYS, HTTP_STATUS } from '../config/api.config';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Attach JWT token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const url = config.url || '';
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!token) {
      // Only warn if this endpoint requires auth (not login/register)
      const publicEndpoints = ['/auth/login', '/auth/register'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));
      
      if (!isPublicEndpoint) {
        console.warn('⚠️ No token found in localStorage, request will be sent without auth');
      }
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle specific HTTP errors
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          console.error('🚫 401 Unauthorized - Token invalid or expired');
          // Token expired or invalid - clear storage
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          
          // Redirect to login only if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;

        case HTTP_STATUS.FORBIDDEN:
          console.error('🚫 403 Forbidden - Insufficient permissions');
          break;
        case HTTP_STATUS.NOT_FOUND:
          console.error('🔍 404 Not Found');
          break;
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          console.error('💥 500 Internal Server Error');
          break;
        default:
          console.error(`❌ HTTP ${status} Error`);
          break;
      }
    } else if (error.request) {
      console.error('🌐 Network Error - No response from server');
    } else {
      console.error('⚠️ Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to extract error message
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Helper function to check if error is network error
export const isNetworkError = (error: any): boolean => {
  return !error.response && error.request;
};

export default api;
