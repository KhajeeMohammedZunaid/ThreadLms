/**
 * API Endpoints Constants
 * All backend API endpoints organized by resource
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },

  // Users
  USERS: {
    PROFILE: (id: string) => `/users/profile/${id}`,
    UPDATE_PROFILE: (id: string) => `/users/profile/${id}`,
    UPLOAD_PROFILE_PICTURE: '/users/upload-profile-picture',
    ENROLLMENTS: (userId: string) => `/users/enrollments/${userId}`,
    ENROLL: '/users/enroll',
    UPDATE_PROGRESS: '/users/progress',
    SUBMIT_ASSIGNMENT: '/users/submit-assignment',
    SAVE_NOTE: '/users/save-note',
    CERTIFICATES: (userId: string) => `/users/certificates/${userId}`,
    NOTIFICATIONS: (userId: string) => `/users/notifications/${userId}`,
    MARK_NOTIFICATION_READ: (notificationId: string) => `/users/notifications/${notificationId}/read`,
  },

  // Courses
  COURSES: {
    GET_ALL: '/courses',
    GET_BY_ID: (id: string) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    UPLOAD_IMAGE: '/courses/upload-image',
    UPLOAD_PREVIEW: '/courses/upload-preview',
    UPLOAD_VIDEO: '/courses/upload-lecture-video',
    ADD_DISCUSSION: (id: string) => `/courses/${id}/discussion`,
    ADD_REPLY: (id: string, threadId: string) => `/courses/${id}/discussion/${threadId}/reply`,
    UPVOTE: (id: string, threadId: string) => `/courses/${id}/discussion/${threadId}/upvote`,
  },

  // Projects
  PROJECTS: {
    GET_ALL: '/projects',
    GET_BY_ID: (id: string) => `/projects/${id}`,
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    UPLOAD_IMAGE: '/projects/upload-image',
    LIKE: (id: string) => `/projects/${id}/like`,
    INCREMENT_VIEW: (id: string) => `/projects/${id}/view`,
  },

  // Collaborations
  COLLABORATIONS: {
    GET_ALL: '/collaborations',
    GET_BY_ID: (id: string) => `/collaborations/${id}`,
    CREATE: '/collaborations',
    UPDATE: (id: string) => `/collaborations/${id}`,
    DELETE: (id: string) => `/collaborations/${id}`,
    REQUEST_JOIN: (id: string) => `/collaborations/${id}/request`,
    APPROVE_MEMBER: (id: string, userId: string) => `/collaborations/${id}/approve/${userId}`,
    REMOVE_MEMBER: (id: string, userId: string) => `/collaborations/${id}/remove/${userId}`,
  },

  // Faculty
  FACULTY: {
    GET_ALL: '/faculty',
    GET_BY_ID: (id: string) => `/faculty/${id}`,
    GET_STUDENTS: (id: string) => `/faculty/${id}/students`,
    GRADE_SUBMISSION: '/faculty/grade',
    GET_ANALYTICS: (id: string) => `/faculty/${id}/analytics`,
  },
};
