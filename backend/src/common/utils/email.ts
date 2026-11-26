/**
 * Canonical form for stored/looked-up emails.
 * Emails are case-insensitive in practice, so we trim surrounding
 * whitespace and lowercase them to avoid duplicate/mismatched accounts.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
