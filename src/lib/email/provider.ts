export type OrderEmail = { to: string; orderNumber: string; status: string }
export type PasswordResetEmail = { to: string; resetUrl: string; expiresAt: Date }

export interface EmailProvider {
  sendOrderUpdate(message: OrderEmail): Promise<{ id: string }>
  sendPasswordReset(message: PasswordResetEmail): Promise<{ id: string }>
}

const recipientDomain = (address: string) => address.split("@")[1] ?? "unknown"

/** Default gratis: hanya mencatat metadata aman, tidak pernah alamat lengkap atau token. */
export class ConsoleEmailProvider implements EmailProvider {
  async sendOrderUpdate(message: OrderEmail) {
    const id = `console-${crypto.randomUUID()}`
    console.info("[email:order-update]", { id, orderNumber: message.orderNumber, status: message.status, recipientDomain: recipientDomain(message.to) })
    return { id }
  }

  async sendPasswordReset(message: PasswordResetEmail) {
    const id = `console-${crypto.randomUUID()}`
    console.info("[email:password-reset]", { id, recipientDomain: recipientDomain(message.to), expiresAt: message.expiresAt.toISOString() })
    if (process.env.NODE_ENV !== "production") console.info("[email:password-reset] tautan demo:", message.resetUrl)
    return { id }
  }
}
