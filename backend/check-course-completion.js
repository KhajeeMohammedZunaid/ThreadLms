const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threadlms';

async function checkCourse() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Courses = mongoose.connection.collection('courses');
    
    const courseId = '68f111224c83fa819af6fe01';
    const course = await Courses.findOne({ _id: new mongoose.Types.ObjectId(courseId) });
    
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    
    console.log(`\n📚 Course: ${course.title}`);
    console.log(`Author ID: ${course.authorId}`);
    
    // Count total items
    let totalItems = 0;
    course.content?.forEach((section, sIdx) => {
      console.log(`\nSection ${sIdx}: ${section.sectionTitle}`);
      section.items?.forEach((item, iIdx) => {
        console.log(`  ${sIdx}-${iIdx}: ${item.type} - ${item.title}`);
        totalItems++;
      });
    });
    
    console.log(`\n📊 Total items in course: ${totalItems}`);
    
    // Check final assessments
    if (course.finalQuiz?.isEnabled) {
      console.log(`✅ Final Quiz: ENABLED (${course.finalQuiz.questions?.length || 0} questions)`);
      totalItems++;
    } else {
      console.log(`❌ Final Quiz: DISABLED`);
    }
    
    console.log(`\n📊 Total items in course: ${totalItems}`);
    
    // Check user's completed items
    const Users = mongoose.connection.collection('users');
    const user = await Users.findOne({ 
      'enrollments.courseId': new mongoose.Types.ObjectId(courseId) 
    });
    
    if (user) {
      const enrollment = user.enrollments.find(e => e.courseId.toString() === courseId);
      console.log(`\n👤 User: ${user.fullName}`);
      console.log(`✅ Completed items: ${enrollment.completedItems.length}`);
      console.log(`Items: [${enrollment.completedItems.join(', ')}]`);
      console.log(`\n💡 Completion: ${enrollment.completedItems.length}/${totalItems} = ${Math.round((enrollment.completedItems.length / totalItems) * 100)}%`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

checkCourse();
