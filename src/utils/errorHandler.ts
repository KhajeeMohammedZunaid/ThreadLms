/**
 * Error Handler Utility
 * Centralized error handling and user-friendly error messages
 */

import { AxiosError } from 'axios';

export interface ErrorResponse {
  status: string;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Extract user-friendly error message
 */
export const handleError = (error: unknown): string => {
  // Axios error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Validation errors
    if (axiosError.response?.data?.errors) {
      const errors = axiosError.response.data.errors;
      const firstError = Object.values(errors)[0];
      return firstError ? firstError[0] : 'Validation error occurred';
    }

    // HTTP status errors
    switch (axiosError.response?.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please login to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Network error
  if (error && typeof error === 'object' && 'request' in error) {
    return 'Network error. Please check your internet connection.';
  }

  // Generic error
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

/**
 * Log error for debugging
 */
export const logError = (error: unknown, context?: string): void => {
  if ((import.meta as any).env?.DEV) {
    console.group(`❌ Error${context ? ` in ${context}` : ''}`);
    console.error(error);
    console.groupEnd();
  }
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 401;
  }
  return false;
};

/**
 * Check if error is validation error
 */
export const isValidationError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return axiosError.response?.status === 400 && !!axiosError.response?.data?.errors;
  }
  return false;
};

/**
 * Get validation errors as object
 */
export const getValidationErrors = (error: unknown): Record<string, string> | null => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    const errors = axiosError.response?.data?.errors;
    
    if (errors) {
      // Convert array of errors to single string per field
      return Object.entries(errors).reduce((acc, [key, messages]) => {
        acc[key] = messages[0]; // Take first error message
        return acc;
      }, {} as Record<string, string>);
    }
  }
  return null;
};

export default {
  handleError,
  logError,
  isAuthError,
  isValidationError,
  getValidationErrors,
};
