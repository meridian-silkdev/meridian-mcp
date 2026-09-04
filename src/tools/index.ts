import { serviceTools } from "./services.js";
import { serviceRequestTools } from "./service-requests.js";
import { workflowTools } from "./workflow.js";
import { paymentTools } from "./payments.js";
import { meetingTools } from "./meetings.js";
import { statusTools } from "./status.js";

export const allTools = [
  ...statusTools,
  ...serviceTools,
  ...serviceRequestTools,
  ...workflowTools,
  ...paymentTools,
  ...meetingTools,
];
