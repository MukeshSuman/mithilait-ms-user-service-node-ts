import cron from 'node-cron';
import { startExamReportProcessCronJob } from './examReportProcessCornJob';

export const initCronJobs = () => {
  console.log('ddd AZURE_SPEECH_REGION', process.env.AZURE_SPEECH_REGION);
  console.log('initCronJobs');
  // Schedule the job to run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('Running a task every five minutes', new Date().toISOString());
    startExamReportProcessCronJob();
    // Add your task logic here
  });

  // cron.schedule('* * * * *', async () => {
  //     try {
  //         console.log('Running exam report job...');

  //         startExamReportProcessCronJob()

  //         // Simulate cleanup logic
  //         // Replace with actual DB cleanup code
  //         console.log('Cleaning up outdated records...');

  //         // Example: Delete records older than 30 days
  //         // await MyModel.deleteMany({ createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });

  //         console.log('Cleanup job completed');
  //     } catch (error) {
  //         console.error('Error in cleanup job:', error);
  //     }
  // });
};
