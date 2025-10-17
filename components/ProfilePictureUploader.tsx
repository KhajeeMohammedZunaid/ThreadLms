import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraIcon } from './icons';
import { uploadProfilePicture, validateFileSize, validateFileType, FileValidationError } from '../src/utils/uploadHelpers';
import { handleError } from '../src/utils/errorHandler';
import { MAX_FILE_SIZES, ALLOWED_FILE_TYPES } from '../src/config/api.config';

interface ProfilePictureUploaderProps {
  initialImage: string;
  onImageChange: (newImage: string) => void;
}

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({ initialImage, onImageChange }) => {
  const [image, setImage] = useState(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);

    try {
      // Validate file
      validateFileSize(file, MAX_FILE_SIZES.PROFILE_PICTURE);
      validateFileType(file, ALLOWED_FILE_TYPES.IMAGES);

      setIsUploading(true);
      setUploadProgress(0);

      // Upload to backend
      const response = await uploadProfilePicture(file, (progress) => {
        setUploadProgress(progress);
      });

      // Update image with the Cloudinary URL
      setImage(response.profilePicture);
      onImageChange(response.profilePicture);
      
      // Reset state after successful upload
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      if (err instanceof FileValidationError) {
        setError(err.message);
      } else {
        setError(handleError(err));
      }
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative mx-auto">
      <div className="relative group w-32 h-32 mx-auto cursor-pointer" onClick={handleClick} aria-label="Change profile picture">
        <img 
          src={image} 
          alt="Profile" 
          className="w-full h-full rounded-full object-cover border-4 border-white shadow-md" 
        />
        
        {/* Upload progress overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              className="absolute inset-0 rounded-full bg-black bg-opacity-70 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-white text-xs font-medium">{uploadProgress}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover overlay */}
        {!isUploading && (
          <motion.div 
            className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            aria-hidden="true"
          >
            <CameraIcon className="w-8 h-8 text-white" />
          </motion.div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif"
          className="hidden"
          aria-hidden="true"
          disabled={isUploading}
        />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-center"
          >
            <p className="text-red-500 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePictureUploader;
