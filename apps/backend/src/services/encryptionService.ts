import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || '';
const IV_LENGTH = 16;
const ENCRYPTED_PAYLOAD_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;

const createDecryptionError = (message: string) => {
  const error = new Error(message);
  (error as Error & { code?: string }).code = 'TOKEN_DECRYPTION_FAILED';
  return error;
};

// ====================================================================
// =====> ADD THIS VALIDATION BLOCK <=====
// This will crash the server on startup if the key is wrong,
// which is better than crashing during a user request.
// ====================================================================
if (SECRET_KEY.length !== 32) {
  throw new Error(
    'Invalid ENCRYPTION_SECRET. The secret key must be exactly 32 characters long for aes-256-cbc encryption.'
  );
}

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  if (!text) {
    throw createDecryptionError('Stored credential is empty.');
  }

  // Backward compatibility for legacy rows that stored tokens in plaintext.
  if (!ENCRYPTED_PAYLOAD_PATTERN.test(text)) {
    return text;
  }

  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedHex, 'hex');

  if (iv.length !== IV_LENGTH || encryptedText.length === 0) {
    throw createDecryptionError('Stored credential format is invalid. Please reconnect your Google account.');
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    throw createDecryptionError(
      'Stored credential could not be decrypted. Your encryption secret may have changed. Please reconnect your Google account.'
    );
  }
};
