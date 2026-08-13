import 'server-only'

/**
 * Transactional email abstraction (spec §27: essential notifications only,
 * no marketing email by default). Swappable via EMAIL_PROVIDER without
 * touching call sites — see lib/actions/notifications.ts for usage.
 */

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>
}

const consoleProvider: EmailProvider = {
  async send(input) {
    // Dev-only fallback — logs instead of sending. Fine for local
    // development; never rely on this in a real deployment.
    console.log('[email:console-provider]', { to: input.to, subject: input.subject })
  },
}

const resendProvider: EmailProvider = {
  async send(input) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY er ikke sat')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'KørMed <ingen-svar@example.dk>',
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    })

    if (!res.ok) {
      throw new Error(`resend_send_failed_${res.status}`)
    }
  },
}

const smtpProvider: EmailProvider = {
  async send() {
    // Not implemented to keep dependencies minimal (spec §38 "keep
    // dependencies to a minimum"). Add a small SMTP client (e.g. nodemailer)
    // here if you need direct SMTP instead of Resend — see README "E-mail".
    throw new Error('SMTP-udbyderen er ikke implementeret i denne version. Brug EMAIL_PROVIDER=resend eller console.')
  },
}

function selectProvider(): EmailProvider {
  switch (process.env.EMAIL_PROVIDER) {
    case 'resend':
      return resendProvider
    case 'smtp':
      return smtpProvider
    case 'console':
    default:
      return consoleProvider
  }
}

export const email = selectProvider()
