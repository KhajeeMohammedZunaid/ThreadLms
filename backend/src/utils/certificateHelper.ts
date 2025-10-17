/**
 * Certificate Generation Utility
 * Helper function to check course completion and generate certificates
 */

import Course from '../models/Course.model';

export const checkAndGenerateCertificate = async (user: any, enrollment: any, courseId: string): Promise<boolean> => {
  const course = await Course.findById(courseId);
  if (!course) return false;

  // Calculate total items (all content items + final quiz if enabled)
  const totalItems = (course.content || []).reduce((sum: number, section: any) => {
    return sum + (section.items?.length || 0);
  }, 0) + (course.finalQuiz?.isEnabled ? 1 : 0);

  console.log('📊 Course completion check:', {
    completedItems: enrollment.completedItems.length,
    totalItems,
    isComplete: enrollment.completedItems.length >= totalItems
  });

  // Check if all items are completed
  if (enrollment.completedItems.length >= totalItems) {
    // Check if certificate already exists
    const existingCert = user.certificates?.find(
      (cert: any) => cert.courseId.toString() === courseId
    );

    if (!existingCert) {
      if (!user.certificates) {
        user.certificates = [];
      }
      
      const certificateId = `${user._id}-${courseId}-${Date.now()}`;
      const completionDate = new Date();
      
      // Set enrollment completion date
      enrollment.completionDate = completionDate;
      
      user.certificates.push({
        id: certificateId,
        courseId: courseId,
        courseTitle: course.title,
        completionDate: completionDate
      } as any);

      console.log('🎓 Certificate generated:', {
        userId: user._id,
        courseId,
        courseTitle: course.title,
        certificateId
      });
      
      return true;
    }
  }
  
  return false;
};
