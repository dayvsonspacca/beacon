export interface EventPayload {
  topic: string;
  source: string;
  data: Record<string, any>;
}
