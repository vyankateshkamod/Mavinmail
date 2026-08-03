/**
 * Metadata Extractor Service
 * 
 * Extracts rich metadata from emails for structured RAG queries:
 * - Domain extraction from email addresses
 * - Email type classification
 * - Vendor detection
 * - Invoice detection with amount extraction
 */

// Email type enum
export type EmailType = 'invoice' | 'receipt' | 'support' | 'personal' | 'notification' | 'marketing' | 'unknown';

// Known vendor domains and patterns
const VENDOR_PATTERNS: Record<string, string[]> = {
    aws: ['amazonaws.com', 'aws.amazon.com', 'amazon.com'],
    stripe: ['stripe.com'],
    google: ['google.com', 'cloud.google.com', 'googlecloud.com'],
    microsoft: ['microsoft.com', 'azure.com', 'office365.com'],
    github: ['github.com', 'github.io'],
    slack: ['slack.com', 'slackbot.com'],
    zoom: ['zoom.us', 'zoom.com'],
    dropbox: ['dropbox.com'],
    notion: ['notion.so', 'notion.com'],
    vercel: ['vercel.com', 'vercel.app'],
    heroku: ['heroku.com'],
    digitalocean: ['digitalocean.com'],
    cloudflare: ['cloudflare.com'],
    twilio: ['twilio.com'],
    sendgrid: ['sendgrid.com', 'sendgrid.net'],
};

// Invoice/receipt indicators
const INVOICE_INDICATORS = [
    /invoice/i,
    /receipt/i,
    /payment received/i,
    /billing statement/i,
    /your order/i,
    /payment confirmation/i,
    /transaction/i,
];

// Support email indicators
const SUPPORT_INDICATORS = [
    /support/i,
    /help desk/i,
    /ticket/i,
    /case #/i,
    /customer service/i,
];

// Notification email indicators
const NOTIFICATION_INDICATORS = [
    /notification/i,
    /alert/i,
    /reminder/i,
    /update:/i,
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
];

// Marketing email indicators
const MARKETING_INDICATORS = [
    /newsletter/i,
    /subscribe/i,
    /promotion/i,
    /discount/i,
    /% off/i,
    /sale/i,
    /limited time/i,
];

// Currency patterns for amount extraction
const AMOUNT_PATTERNS = [
    /\$[\d,]+\.?\d*/g,                                    // $123.45 or $1,234.56
    /USD\s*[\d,]+\.?\d*/gi,                               // USD 123.45
    /€[\d,]+\.?\d*/g,                                      // €123.45
    /EUR\s*[\d,]+\.?\d*/gi,                               // EUR 123.45
    /£[\d,]+\.?\d*/g,                                      // £123.45
    /GBP\s*[\d,]+\.?\d*/gi,                               // GBP 123.45
    /₹[\d,]+\.?\d*/g,                                      // ₹123.45
    /INR\s*[\d,]+\.?\d*/gi,                               // INR 123.45
    /Total:?\s*\$?[\d,]+\.?\d*/gi,                        // Total: $123.45
    /Amount:?\s*\$?[\d,]+\.?\d*/gi,                       // Amount: $123.45
    /Charged:?\s*\$?[\d,]+\.?\d*/gi,                      // Charged: $123.45
];

/**
 * Extracts domain from an email address
 */
export const extractDomain = (email: string): string => {
    if (!email) return '';

    // Robustly find email address: matches user@domain.tld
    const match = email.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);

    if (match) {
        const fullEmail = match[0]; // The full email address
        const parts = fullEmail.split('@');
        return parts.length > 1 ? parts[1].toLowerCase() : '';
    }

    return '';
};

/**
 * Detects vendor from email address and subject
 */
export const detectVendor = (from: string, subject: string): string | null => {
    const domain = extractDomain(from);
    const textToCheck = `${from} ${subject} ${domain}`.toLowerCase();

    for (const [vendor, patterns] of Object.entries(VENDOR_PATTERNS)) {
        for (const pattern of patterns) {
            if (domain.includes(pattern) || textToCheck.includes(vendor)) {
                return vendor;
            }
        }
    }

    return null;
};

/**
 * Classifies email type based on content analysis
 */
export const classifyEmailType = (
    subject: string,
    from: string,
    body: string
): EmailType => {
    const textToCheck = `${subject} ${from} ${body.substring(0, 1000)}`;

    // Check for invoice/receipt (highest priority)
    if (INVOICE_INDICATORS.some(pattern => pattern.test(textToCheck))) {
        return 'invoice';
    }

    // Check for support
    if (SUPPORT_INDICATORS.some(pattern => pattern.test(textToCheck))) {
        return 'support';
    }

    // Check for notifications
    if (NOTIFICATION_INDICATORS.some(pattern => pattern.test(textToCheck))) {
        return 'notification';
    }

    // Check for marketing
    if (MARKETING_INDICATORS.some(pattern => pattern.test(textToCheck))) {
        return 'marketing';
    }

    // Default to personal if no patterns match
    return 'personal';
};

/**
 * Extracts invoice information including amount
 */
export const extractInvoiceInfo = (
    body: string,
    subject: string
): { isInvoice: boolean; amount: number | null; currency: string | null } => {
    const textToCheck = `${subject} ${body}`;

    // Check if this is an invoice
    const isInvoice = INVOICE_INDICATORS.some(pattern => pattern.test(textToCheck));

    if (!isInvoice) {
        return { isInvoice: false, amount: null, currency: null };
    }

    // Try to extract amount
    let amount: number | null = null;
    let currency: string | null = null;

    for (const pattern of AMOUNT_PATTERNS) {
        const matches = textToCheck.match(pattern);
        if (matches && matches.length > 0) {
            // Find the largest amount (usually the total)
            for (const match of matches) {
                // Extract currency
                if (match.includes('$') || match.toLowerCase().includes('usd')) {
                    currency = 'USD';
                } else if (match.includes('€') || match.toLowerCase().includes('eur')) {
                    currency = 'EUR';
                } else if (match.includes('£') || match.toLowerCase().includes('gbp')) {
                    currency = 'GBP';
                } else if (match.includes('₹') || match.toLowerCase().includes('inr')) {
                    currency = 'INR';
                }

                // Extract numeric value
                const numericStr = match.replace(/[^0-9.]/g, '');
                const value = parseFloat(numericStr);

                if (!isNaN(value) && (amount === null || value > amount)) {
                    amount = value;
                }
            }
        }
    }

    return { isInvoice, amount, currency };
};

/**
 * Parses timestamp into date components
 */
export const parseDate = (timestamp: string): { date: string; month: string } => {
    try {
        const date = new Date(timestamp);
        const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const month = isoDate.substring(0, 7); // YYYY-MM
        return { date: isoDate, month };
    } catch {
        const now = new Date();
        const isoDate = now.toISOString().split('T')[0];
        return { date: isoDate, month: isoDate.substring(0, 7) };
    }
};

/**
 * Full metadata extraction from email
 */
export interface ExtractedMetadata {
    fromDomain: string;
    emailType: EmailType;
    vendor: string | null;
    isInvoice: boolean;
    amount: number | null;
    currency: string | null;
    date: string;
    month: string;
}

export const extractFullMetadata = (
    from: string,
    subject: string,
    body: string,
    timestamp: string
): ExtractedMetadata => {
    const fromDomain = extractDomain(from);
    const vendor = detectVendor(from, subject);
    const emailType = classifyEmailType(subject, from, body);
    const { isInvoice, amount, currency } = extractInvoiceInfo(body, subject);
    const { date, month } = parseDate(timestamp);

    return {
        fromDomain,
        emailType,
        vendor,
        isInvoice,
        amount,
        currency,
        date,
        month,
    };
};

export const metadataExtractorService = {
    extractDomain,
    detectVendor,
    classifyEmailType,
    extractInvoiceInfo,
    parseDate,
    extractFullMetadata,
};
