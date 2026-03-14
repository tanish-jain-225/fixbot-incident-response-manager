const nodemailer = require("nodemailer");

function buildTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

function buildIncidentDocument(incident) {
  return [
    "FixBot Incident Analysis",
    "========================",
    `Incident ID: ${incident._id}`,
    `Date: ${new Date(incident.createdAt).toISOString()}`,
    `Severity: ${incident.severity}`,
    `Confidence Score: ${incident.confidenceScore}%`,
    "",
    "Root Cause",
    "----------",
    incident.rootCause,
    "",
    "Suggested Fix",
    "-------------",
    incident.suggestedFix,
    "",
    "Explanation",
    "-----------",
    incident.explanation,
    "",
    "Original Log",
    "------------",
    incident.logText,
    "",
    "Code Snippet",
    "------------",
    incident.codeSnippet || "(none)",
    "",
  ].join("\n");
}

async function sendIncidentEmail({ toEmail, incident }) {
  const transporter = buildTransporter();

  if (!transporter) {
    return false;
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const documentText = buildIncidentDocument(incident);

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: `FixBot Analysis: ${incident.severity} - ${incident._id}`,
    text: "Your FixBot incident analysis is attached as a text document.",
    attachments: [
      {
        filename: `fixbot-analysis-${incident._id}.txt`,
        content: documentText,
      },
    ],
  });

  return true;
}

module.exports = { sendIncidentEmail };
