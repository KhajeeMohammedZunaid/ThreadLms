/**
 * Upload Helpers
 * Utility functions for file uploads to Cloudinary via backend
 */

import api, { getErrorMessage } from '../services/api';
import { API_ENDPOINTS } from '../config/constants';
import { MAX_FILE_SIZES, ALLOWED_FILE_TYPES } from '../config/api.config';

// Validation error class
export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSize: number): void => {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new FileValidationError(`File size must be under ${maxSizeMB}MB`);
  }
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, allowedTypes: string[]): void => {
  if (!allowedTypes.includes(file.type)) {
    const types = allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ');
    throw new FileValidationError(`Only ${types} files are allowed`);
  }
};

/**
 * Create FormData for file upload
 */
const createFormData = (file: File, fieldName: string): FormData => {
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
};

/**
 * Generic upload function with progress tracking
 */
export const uploadFile = async (
  endpoint: string,
  file: File,
  fieldName: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  try {
    const formData = createFormData(file, fieldName);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ profilePicture: string }> => {
  // Validate file
  validateFileSize(file, MAX_FILE_SIZES.PROFILE_PICTURE);
  validateFileType(file, ALLOWED_FILE_TYPES.IMAGES);

  const response = await uploadFile(
    API_ENDPOINTS.USERS.UPLOAD_PROFILE_PICTURE,
    file,
    'profilePicture',
    onProgress
  );

  return response.data;
};

/**
 * Upload course image (thumbnail)
 */
export const uploadCourseImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ imageUrl: string }> => {
  // Validate file
  validateFileSize(file, MAX_FILE_SIZES.COURSE_IMAGE);
  validateFileType(file, ALLOWED_FILE_TYPES.IMAGES);

  const response = await uploadFile(
    API_ENDPOINTS.COURSES.UPLOAD_IMAGE,
    file,
    'courseImage',
    onProgress
  );

  return response.data;
};

/**
 * Upload course preview image
 */
export const uploadCoursePreview = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ previewUrl: string }> => {
  // Validate file
  validateFileSize(file, MAX_FILE_SIZES.COURSE_IMAGE);
  validateFileType(file, ALLOWED_FILE_TYPES.IMAGES);

  const response = await uploadFile(
    API_ENDPOINTS.COURSES.UPLOAD_PREVIEW,
    file,
    'previewImage',
    onProgress
  );

  return response.data;
};

/**
 * Upload lecture video
 */
export const uploadLectureVideo = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ videoUrl: string; videoType: 'upload' }> => {
  // Validate file
  validateFileSize(file, MAX_FILE_SIZES.LECTURE_VIDEO);
  validateFileType(file, ALLOWED_FILE_TYPES.VIDEOS);

  const response = await uploadFile(
    API_ENDPOINTS.COURSES.UPLOAD_VIDEO,
    file,
    'lectureVideo',
    onProgress
  );

  return response.data;
};

/**
 * Upload project image
 */
export const uploadProjectImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ imageUrl: string }> => {
  // Validate file
  validateFileSize(file, MAX_FILE_SIZES.PROJECT_IMAGE);
  validateFileType(file, ALLOWED_FILE_TYPES.IMAGES);

  const response = await uploadFile(
    API_ENDPOINTS.PROJECTS.UPLOAD_IMAGE,
    file,
    'projectImage',
    onProgress
  );

  return response.data;
};

/**
 * Create image preview URL from File
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
