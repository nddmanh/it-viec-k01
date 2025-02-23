import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from './mail.service';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'send-mail-applicant') {
      await this.mailService.sendMail(
        job.data.email,
        'Welcome to IT VIEC',
        'welcome-applicant',
        {
          name: job.data.name,
          email: job.data.email,
        },
      );
      console.log('job đã được xử lý thành công ', job.data);
    }

    if (job.name === 'send-mail-company') {
      await this.mailService.sendMail(
        job.data.email,
        'Welcome your company to IT VIEC',
        'welcome-company',
        {
          name: job.data.name,
          email: job.data.email,
          company: job.data.company,
        },
      );
      console.log(
        'job send mail to company đã được xử lý thành công ',
        job.data,
      );
    }
  }
}
