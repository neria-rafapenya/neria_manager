export interface ConversationSummary {
  patient: string;
  reason: string;
  channel: string;
  status: string;
  summary: string;
}

export interface AppointmentSummary {
  patient: string;
  type: string;
  time: string;
  status: string;
}
