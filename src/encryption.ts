import * as crypto from 'crypto';

// Function to generate a key from a password
function generateKey(password: string, salt: string): Buffer {
    return crypto.scryptSync(password, salt, 32); // 32 bytes = 256-bit key
}

// Encrypt a keyphrase with the password
export function encryptKeyphrase(keyphrase: string, password: string): string {
    const iv = crypto.randomBytes(16); // Initialization vector
    const salt = crypto.randomBytes(16).toString('hex'); // Salt for key generation
    const key = generateKey(password, salt);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(keyphrase, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return the IV, salt, and encrypted data as a concatenated string
    return `${iv.toString('hex')}:${salt}:${encrypted}`;
}

// Decrypt an encrypted keyphrase with the password
export function decryptKeyphrase(encryptedData: string, password: string): string {
    const [ivHex, salt, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = generateKey(password, salt);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// Example usage
// const keyphrase = 'apple banana orange lemon pear cherry peach plum grape kiwi mango papaya'; // Example 12-word keyphrase
// const password = 'strongpassword123';

// const encrypted = encryptKeyphrase(keyphrase, password);
// console.log('Encrypted:', encrypted);

// const decrypted = decryptKeyphrase(encrypted, password);
// console.log('Decrypted:', decrypted);
