import "server-only";
import { serverEnv } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: string[];
};

export type SendResult = { sent: true; id: string } | { sent: false; reason: "not_configured" | "failed"; detail?: string };

/** Sends a message through Mailgun's HTTP API. Never throws; callers decide how to react. */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const config = serverEnv.mailgun();
  if (!config) {
    console.warn(
      `[email] Mailgun is not configured (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL). Skipped "${message.subject}".`,
    );
    return { sent: false, reason: "not_configured" };
  }

  const body = new FormData();
  body.set("from", config.from);
  body.set("to", message.to);
  body.set("subject", message.subject);
  body.set("html", message.html);
  body.set("text", message.text);
  if (message.replyTo) body.set("h:Reply-To", message.replyTo);
  for (const tag of message.tags ?? []) body.append("o:tag", tag);

  try {
    const response = await fetch(`${config.baseUrl}/v3/${encodeURIComponent(config.domain)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}` },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[email] Mailgun responded ${response.status}`, detail.slice(0, 500));
      return { sent: false, reason: "failed", detail: `${response.status}` };
    }
    const json = (await response.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: json.id ?? "" };
  } catch (error) {
    console.error("[email] Mailgun request failed", error);
    return { sent: false, reason: "failed", detail: error instanceof Error ? error.message : String(error) };
  }
}
