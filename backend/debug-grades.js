const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threadlms';

async function debugGrades() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.connection.collection('users');
    
    // Find all users with enrollments
    const users = await User.find({ enrollments: { $exists: true, $ne: [] } }).toArray();
    
    console.log(`\n📚 Found ${users.length} users with enrollments\n`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.fullName} (${user.email})`);
      console.log(`ID: ${user._id}`);
      
      for (const enrollment of user.enrollments || []) {
        console.log(`\n  📖 Course ID: ${enrollment.courseId}`);
        console.log(`  ✅ Completed Items: ${enrollment.completedItems?.length || 0}`);
        
        if (enrollment.assignmentSubmissions) {
          console.log(`\n  📝 Assignment Submissions: ${enrollment.assignmentSubmissions.length}`);
          enrollment.assignmentSubmissions.forEach((sub, idx) => {
            console.log(`    ${idx + 1}. Item: ${sub.itemId}`);
            console.log(`       Grade: ${sub.grade !== undefined ? sub.grade : 'NOT GRADED'}`);
            console.log(`       Has feedback: ${!!sub.feedback}`);
          });
        }
        
        if (enrollment.finalQuizScore !== undefined) {
          console.log(`\n  📝 Final Quiz Score: ${enrollment.finalQuizScore}/10`);
        }
        
        if (user.certificates) {
          const courseCert = user.certificates.find(c => c.courseId.toString() === enrollment.courseId.toString());
          if (courseCert) {
            console.log(`\n  🎓 Certificate: YES (ID: ${courseCert.id})`);
          } else {
            console.log(`\n  🎓 Certificate: NO`);
          }
        }
      }
      console.log('\n' + '='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

debugGrades();
