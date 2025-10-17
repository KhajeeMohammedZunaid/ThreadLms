import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { Request } from 'express';

// File filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// File filter for videos
const videoFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

// ========================================
// PROFILE PICTURE UPLOAD
// ========================================
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'threadlms/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 500, height: 500, crop: 'limit', quality: 'auto' }
      ],
      public_id: `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: { 
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: imageFileFilter,
});

// ========================================
// COURSE IMAGE UPLOAD (Thumbnail)
// ========================================
const courseImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'threadlms/courses/images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1200, height: 675, crop: 'fill', quality: 'auto', gravity: 'auto' }
      ],
      public_id: `course_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

export const uploadCourseImage = multer({
  storage: courseImageStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFileFilter,
});

// ========================================
// COURSE PREVIEW IMAGE UPLOAD
// ========================================
const coursePreviewStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'threadlms/courses/previews',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1920, height: 1080, crop: 'fill', quality: 'auto', gravity: 'auto' }
      ],
      public_id: `preview_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

export const uploadCoursePreview = multer({
  storage: coursePreviewStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFileFilter,
});

// ========================================
// PROJECT IMAGE UPLOAD
// ========================================
const projectImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'threadlms/projects',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1200, height: 800, crop: 'fill', quality: 'auto', gravity: 'auto' }
      ],
      public_id: `project_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

export const uploadProjectImage = multer({
  storage: projectImageStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: imageFileFilter,
});

// ========================================
// LECTURE VIDEO UPLOAD
// ========================================
const lectureVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'threadlms/lectures',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ],
      public_id: `lecture_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  },
});

export const uploadLectureVideo = multer({
  storage: lectureVideoStorage,
  limits: { 
    fileSize: 100 * 1024 * 1024 // 100MB (Cloudinary free tier limit)
  },
  fileFilter: videoFileFilter,
});

// ========================================
// ERROR HANDLER FOR MULTER
// ========================================
export const handleMulterError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File is too large. Please check the size limits.'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'File upload failed'
    });
  }
  
  next();
};
