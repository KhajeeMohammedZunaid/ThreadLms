// Quick debug script to check user data
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threadlms';

async function checkUser(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Faculty = mongoose.model('Faculty', new mongoose.Schema({}, { strict: false }));
    
    // Search in User collection
    let user = await User.findOne({ email });
    let collection = 'User';
    
    // If not found, search in Faculty
    if (!user) {
      user = await Faculty.findOne({ email });
      collection = 'Faculty';
    }

    if (!user) {
      console.log('❌ User not found with email:', email);
      mongoose.connection.close();
      return;
    }

    console.log(`📋 Found in ${collection} collection:`);
    console.log('   _id:', user._id.toString());
    console.log('   Email:', user.email);
    console.log('   Name:', user.fullName);
    console.log('   Role:', user.role);
    console.log('   Notifications:', user.notifications?.length || 0);
    console.log('\n🔑 User object for localStorage:');
    console.log(JSON.stringify({
      _id: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      profilePicture: user.profilePicture
    }, null, 2));

    if (user.notifications && user.notifications.length > 0) {
      console.log('\n📬 Notifications:');
      user.notifications.forEach((n, i) => {
        console.log(`   ${i + 1}. [${n.type}] ${n.message}`);
        console.log(`      ID: ${n.id}, Read: ${n.isRead}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node debug-user.js <email>');
  console.log('Example: node debug-user.js opzunaid26@gmail.com');
  process.exit(1);
}

checkUser(email);
