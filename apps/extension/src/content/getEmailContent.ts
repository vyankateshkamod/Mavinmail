// This script is designed to be injected and executed on demand.

/**
 * Finds the main content of the currently viewed email in Gmail.
 * Gmail's class names can be obfuscated and change, so we try a few reliable selectors.
 * @returns The inner text of the email body element, or null if not found.
 */
// function getEmailContent(): string | null {
//   console.log('Meeco AI: Content script executing to find email body.');
  
//   const selectors = [
//     '.a3s.aiO',           // Standard email view
//     '.gs .ii.gt',         // Another common container for emails
//     'div[role="listitem"] .a3s', // Often used in conversation threads
//   ];

//   for (const selector of selectors) {
//     const emailBody = document.querySelector(selector);
//     if (emailBody) {
//       console.log(`Meeco AI: Email content FOUND with selector: "${selector}"`);
//       return (emailBody as HTMLElement).innerText;
//     }
//   }

//   console.log('Meeco AI: Email content NOT FOUND with any known selectors.');
//   return null;
// }

// // Execute the function and send the result back to the background script
// chrome.runtime.sendMessage({
//   type: 'EMAIL_CONTENT_RESULT',
//   payload: getEmailContent(),
// });


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