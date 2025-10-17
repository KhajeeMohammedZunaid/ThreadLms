import cron from 'node-cron';
import { generateAndSendNewsletter } from '../services/newsletter.service';

// Newsletter Cron Job
// Runs automatically every 2 days at 9:00 AM
// Cron Expression: 0 9 */2 * *

export function startNewsletterCron(): void {
  // Run every 2 days at 9:00 AM IST
  const schedule = '0 9 */2 * *';
  const timezone = 'Asia/Kolkata';
  
  console.log('\n📰 Newsletter Cron Job Configuration:');
  console.log('   Schedule: Every 2 days at 9:00 AM');
  console.log(`   Timezone: ${timezone}`);
  console.log(`   Cron Expression: ${schedule}`);
  
  cron.schedule(
    schedule,
    async () => {
      console.log('\n⏰ CRON TRIGGER: Newsletter job started');
      console.log(`   Triggered at: ${new Date().toLocaleString('en-IN', { timeZone: timezone })}`);
      
      try {
        const result = await generateAndSendNewsletter();
        
        if (result.success) {
          console.log(`✅ Scheduled newsletter completed: ${result.recipientCount} recipients`);
        } else {
          console.log(`⚠️ Newsletter failed: ${result.message}`);
        }
      } catch (error: any) {
        console.error('❌ Scheduled newsletter error:', error.message);
      }
    },
    {
      timezone: timezone
    }
  );
  
  console.log('✅ Newsletter cron job initialized successfully\n');
  
  // Log next run time
  const nextRun = getNextRunTime();
  console.log(`📅 Next scheduled run: ${nextRun}\n`);
}

/**
 * Calculate next run time for display
 */
function getNextRunTime(): string {
  const now = new Date();
  const next = new Date(now);
  
  // If current hour is before 9 AM, next run is today at 9 AM
  // Otherwise, add 2 days
  if (now.getHours() < 9) {
    next.setHours(9, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 2);
    next.setHours(9, 0, 0, 0);
  }
  
  return next.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Manual trigger for testing (optional)
 * Usage: import and call this function to test newsletter manually
 */
export async function triggerNewsletterManually(): Promise<void> {
  console.log('\n🔧 MANUAL TRIGGER: Newsletter generation started\n');
  
  try {
    const result = await generateAndSendNewsletter();
    
    if (result.success) {
      console.log(`\n✅ Manual newsletter sent: ${result.recipientCount} recipients\n`);
    } else {
      console.log(`\n⚠️ Manual newsletter failed: ${result.message}\n`);
    }
  } catch (error: any) {
    console.error(`\n❌ Manual newsletter error: ${error.message}\n`);
  }
}
