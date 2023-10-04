async function(properties, context) {
    
 // declare variables
    const crypto = require('crypto');
    const client_id = crypto.randomUUID();
    const client_secret = crypto.randomUUID();
    
 // encryption function
    function encryptData(text, password) {
        const KEY_LENGTH = 32; // AES-256
        const IV_LENGTH = 12;  // GCM standard
        const ITERATIONS = 100000;  // Matched with Cloudflare Workers' iterations

        const salt = crypto.randomBytes(16);
        const keyDerivation = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');  // Using PBKDF2 now
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', keyDerivation, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64');
    }
    
    const encryptedSecret = encryptData(client_secret, client_id);
    
    return {
        client_id: client_id,
        client_secret: client_secret,
        encrypted_secret: encryptedSecret
    }
    
}