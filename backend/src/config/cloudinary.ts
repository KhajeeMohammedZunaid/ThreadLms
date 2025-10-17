import { v2 as cloudinary } from 'cloudinary';

// Get environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validate environment variables before configuring
if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary configuration error: Missing environment variables');
  console.error('Please ensure the following are set in your .env file:');
  console.error('   - CLOUDINARY_CLOUD_NAME');
  console.error('   - CLOUDINARY_API_KEY');
  console.error('   - CLOUDINARY_API_SECRET');
  console.error('\nCurrent values:');
  console.error(`   CLOUDINARY_CLOUD_NAME: ${cloudName || 'NOT SET'}`);
  console.error(`   CLOUDINARY_API_KEY: ${apiKey ? '***' + apiKey.slice(-4) : 'NOT SET'}`);
  console.error(`   CLOUDINARY_API_SECRET: ${apiSecret ? '***' + apiSecret.slice(-4) : 'NOT SET'}`);
  
  // Don't throw error in development to allow server to start
  // But log warning that uploads won't work
  console.warn('\n⚠️  WARNING: Image uploads will not work until Cloudinary is configured!\n');
}

// Cloudinary configuration
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true, // Use HTTPS
});

// Verify configuration on startup
export const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    console.warn('⚠️  Cloudinary configuration incomplete. Please set environment variables:');
    console.warn('   - CLOUDINARY_CLOUD_NAME');
    console.warn('   - CLOUDINARY_API_KEY');
    console.warn('   - CLOUDINARY_API_SECRET');
    return false;
  }
  
  console.log('✅ Cloudinary configured successfully');
  console.log(`📦 Cloud Name: ${cloud_name}`);
  console.log(`🔑 API Key: ***${api_key.slice(-4)}`);
  return true;
};

// Call verification
verifyCloudinaryConfig();

export default cloudinary;
