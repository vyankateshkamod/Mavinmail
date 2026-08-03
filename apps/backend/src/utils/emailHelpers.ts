/**
 * Email Helper Utilities.
 *
 * Extracted from gmailController to make email parsing logic
 * reusable across controllers and services.
 */

/**
 * Decode base64url-encoded email body data.
 */
export function decodeBase64(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
}

/**
 * Recursively extract text/plain body from a Gmail message payload.
 * Handles both simple and multipart MIME structures.
 */
export function getEmailBody(payload: any): string {
    if (!payload) return '';

    // Direct body
    if (payload.body?.data) {
        return decodeBase64(payload.body.data);
    }

    // Multipart — prefer text/plain
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return decodeBase64(part.body.data);
            }
            // Handle nested multipart
            if (part.parts) {
                const nested = getEmailBody(part);
                if (nested) return nested;
            }
        }
    }

    return '';
}

/**
 * Clean raw email body text — collapse whitespace, truncate to maxLen.
 */
export function cleanEmailBody(rawBody: string, maxLen = 5000): string {
    return rawBody.replace(/\s+/g, ' ').substring(0, maxLen);
}

/**
 * Determine email category from Gmail label IDs.
 */
export function categorizeEmail(labelIds: string[]): string {
    if (labelIds.includes('CATEGORY_SOCIAL')) return 'Social';
    if (labelIds.includes('CATEGORY_PROMOTIONS')) return 'Promotions';
    if (labelIds.includes('CATEGORY_UPDATES')) return 'Updates';
    return 'Primary';
}

/**
 * Extract common headers from a Gmail message payload.
 */
export function extractHeaders(
    headers: Array<{ name?: string | null; value?: string | null }> | undefined
): { from: string; subject: string; date: string } {
    const get = (name: string) =>
        headers?.find(h => h.name === name)?.value || 'N/A';

    return {
        from: get('From'),
        subject: get('Subject'),
        date: get('Date'),
    };
}
