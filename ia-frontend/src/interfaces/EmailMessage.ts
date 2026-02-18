export interface EmailMessage {
  id: string;
  accountId?: string;
  subject?: string | null;
  fromEmail?: string | null;
  fromName?: string | null;
  receivedAt?: string | null;
  status?: string | null;
  intent?: string | null;
  priority?: string | null;
  actionType?: string | null;
  actionStatus?: string | null;
  jiraIssueKey?: string | null;
  jiraIssueUrl?: string | null;
  bodyPreview?: string | null;
}
