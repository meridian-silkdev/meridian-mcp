import { serviceTools } from "./services.js";
import { serviceRequestTools } from "./service-requests.js";
import { workflowTools } from "./workflow.js";
import { paymentTools } from "./payments.js";
import { meetingTools } from "./meetings.js";

export const allTools = [
  ...serviceTools,
  ...serviceRequestTools,
  ...workflowTools,
  ...paymentTools,
  ...meetingTools,
];
