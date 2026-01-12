export enum JobType {
  SEND_REMINDER = 'send_reminder',
  SCAN_INBOX = 'scan_inbox',
  CLEANUP_PENDING = 'cleanup_pending',
}

export interface SendReminderJob {
  reminderId: string
}

export interface ScanInboxJob {
  userId: string
  fullScan: boolean // true = scan last 90 days, false = scan last 30 days
}

export type JobData = SendReminderJob | ScanInboxJob
