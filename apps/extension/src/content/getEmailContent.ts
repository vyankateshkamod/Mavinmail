// This script is designed to be injected and executed on demand.

/**
 * Finds the main content of the currently viewed email in Gmail.
 * Gmail's class names can be obfuscated and change, so we try a few reliable selectors.
 * @returns The inner text of the email body element, or null if not found.
 */

function getEmailContent(): string | null {
  const selectors = ['.a3s.aiO', '.gs .ii.gt', 'div[role="listitem"] .a3s'];
  for (const selector of selectors) {
    const emailBody = document.querySelector(selector);
    if (emailBody) {
      return (emailBody as HTMLElement).innerText;
    }
  }
  return null;
}
getEmailContent();