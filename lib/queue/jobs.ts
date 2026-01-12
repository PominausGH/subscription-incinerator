export enum JobType {
  SEND_REMINDER = 'send_reminder',
}

export interface SendReminderJob {
  reminderId: string
}

export type JobData = SendReminderJob
