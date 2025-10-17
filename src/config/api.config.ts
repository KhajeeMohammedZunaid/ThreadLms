/**
 * API Configuration
 * Central configuration for all API-related settings
 */

// Base API URL - adjust based on environment
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

// API timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// File upload timeout (longer for videos)
export const UPLOAD_TIMEOUT = 300000; // 5 minutes

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  PROFILE_PICTURE: 2 * 1024 * 1024, // 2MB
  COURSE_IMAGE: 5 * 1024 * 1024, // 5MB
  PROJECT_IMAGE: 5 * 1024 * 1024, // 5MB
  LECTURE_VIDEO: 100 * 1024 * 1024, // 100MB
};

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  VIDEOS: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv'],
};

// Token storage keys
export const STORAGE_KEYS = {
  TOKEN: 'threadlms_token',
  USER: 'threadlms_user',
  REFRESH_TOKEN: 'threadlms_refresh_token',
};

// API response status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  FAIL: 'fail',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
