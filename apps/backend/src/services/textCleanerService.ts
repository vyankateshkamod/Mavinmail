/**
 * Text Cleaner Service
 * 
 * Cleans email content for optimal RAG embedding:
 * - Removes quoted replies
 * - Removes signatures
 * - Removes legal footers
 * - Strips HTML tags
 */

// Common signature patterns
const SIGNATURE_PATTERNS = [
    /^--\s*$/gm,                                    // Standard -- signature delimiter
    /^_{3,}$/gm,                                    // ___ underline delimiter
    /Sent from my (iPhone|iPad|Android|Samsung)/gi,
    /Get Outlook for (iOS|Android)/gi,
    /\n(Best|Thanks|Regards|Cheers|Sincerely),?\s*\n/gi,
];

// Quoted reply patterns
const QUOTED_REPLY_PATTERNS = [
    /On .+wrote:\s*$/gm,                            // On [date] [person] wrote:
    /^>+.*$/gm,                                      // Lines starting with >
    /^From:.*\nSent:.*\nTo:.*\nSubject:.*/gm,       // Outlook forward headers
    /-{3,}\s*Original Message\s*-{3,}/gi,           // --- Original Message ---
    /-{3,}\s*Forwarded message\s*-{3,}/gi,          // --- Forwarded message ---
];

// Legal footer patterns
const LEGAL_FOOTER_PATTERNS = [
    /This email and any attachments.*(confidential|privileged).*/gis,
    /CONFIDENTIALITY NOTICE:.*/gis,
    /This message contains confidential information.*/gis,
    /If you are not the intended recipient.*/gis,
    /Please consider the environment before printing.*/gi,
    /Unsubscribe.*$/gim,
    /Click here to unsubscribe.*/gi,
    /To stop receiving these emails.*/gi,
    /View in browser.*/gi,
];

/**
 * Removes quoted replies from email content
 */
export const removeQuotedReplies = (text: string): string => {
    let cleaned = text;

    for (const pattern of QUOTED_REPLY_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
};

/**
 * Removes email signatures
 */
export const removeSignatures = (text: string): string => {
    let cleaned = text;

    // Remove everything after common signature delimiters
    const signatureDelimiters = ['--\n', '\n--\n', '\n___'];
    for (const delimiter of signatureDelimiters) {
        const idx = cleaned.indexOf(delimiter);
        if (idx !== -1 && idx > cleaned.length * 0.5) {
            // Only cut if delimiter is in the last half of the email
            cleaned = cleaned.substring(0, idx);
        }
    }

    for (const pattern of SIGNATURE_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
};

/**
 * Removes legal footers and disclaimers
 */
export const removeLegalFooters = (text: string): string => {
    let cleaned = text;

    for (const pattern of LEGAL_FOOTER_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
};

/**
 * Strips HTML tags from text
 */
export const stripHtml = (text: string): string => {
    return text
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')    // Remove style blocks
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')  // Remove script blocks
        .replace(/<[^>]+>/g, ' ')                           // Remove all HTML tags
        .replace(/&nbsp;/g, ' ')                            // Replace &nbsp;
        .replace(/&amp;/g, '&')                             // Replace &amp;
        .replace(/&lt;/g, '<')                              // Replace &lt;
        .replace(/&gt;/g, '>')                              // Replace &gt;
        .replace(/&quot;/g, '"')                            // Replace &quot;
        .replace(/&#39;/g, "'")                             // Replace &#39;
        .replace(/\s+/g, ' ')                               // Collapse whitespace
        .trim();
};

/**
 * Normalizes whitespace and removes empty lines
 */
export const normalizeWhitespace = (text: string): string => {
    return text
        .replace(/\r\n/g, '\n')           // Normalize line endings
        .replace(/\t/g, ' ')               // Replace tabs with spaces
        .replace(/ +/g, ' ')               // Collapse multiple spaces
        .replace(/\n{3,}/g, '\n\n')        // Max 2 consecutive newlines
        .trim();
};

/**
 * Main cleaning function - applies all transformations
 */
export const cleanEmailContent = (text: string): string => {
    if (!text) return '';

    let cleaned = text;

    // Order matters: do HTML first, then structural cleaning
    cleaned = stripHtml(cleaned);
    cleaned = removeQuotedReplies(cleaned);
    cleaned = removeSignatures(cleaned);
    cleaned = removeLegalFooters(cleaned);
    cleaned = normalizeWhitespace(cleaned);

    return cleaned;
};

export const textCleanerService = {
    removeQuotedReplies,
    removeSignatures,
    removeLegalFooters,
    stripHtml,
    normalizeWhitespace,
    cleanEmailContent,
};
