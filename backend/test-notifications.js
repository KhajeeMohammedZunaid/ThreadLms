// Test script to check notifications
// Run with: node test-notifications.js

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threadlms';

async function testNotifications() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Find the most recent user
    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    
    console.log('\n📊 Recent Users:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.fullName} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Notifications: ${user.notifications?.length || 0}`);
      
      if (user.notifications && user.notifications.length > 0) {
        console.log('   📬 Notifications:');
        user.notifications.forEach((notif, idx) => {
          console.log(`      ${idx + 1}. Type: ${notif.type}, Message: ${notif.message}`);
          console.log(`         ID: ${notif.id}, Read: ${notif.isRead}`);
        });
      } else {
        console.log('   ⚠️  NO NOTIFICATIONS FOUND!');
      }
      
      if (user.notificationSettings) {
        console.log('   ⚙️  Settings:', JSON.stringify(user.notificationSettings));
      } else {
        console.log('   ⚠️  No notification settings');
      }
    });

    mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testNotifications();
