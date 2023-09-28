function(properties, context) {
	if(!context.keys.CLIENT_ID) return {ai_token: "", error: "CLIENT_ID is empty"}
	if(!context.keys.CLIENT_SECRET) return {ai_token: "", error: "CLIENT_SECRET is empty"}
    if(!properties.params) return {ai_token: "", error: "Query is empty"}
    var api_key = (properties.api_key || context.keys.AI_API_KEY)
    if(!api_key) return {ai_token: "", error: "AI Api Key is empty"}
        
    const crypto = require('crypto');

    function encrypt(text, password) {
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
    
    const encryptedApiKey = encrypt(api_key, context.keys.CLIENT_SECRET);
	
    var jwt = require("jsonwebtoken")
    
    function utf8_to_b64(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }
    
    if(properties.params) var params = (properties.encrypt ? encrypt(properties.params, context.keys.CLIENT_SECRET) : utf8_to_b64(properties.params))

    var token = jwt.sign({params: params, api_key: encryptedApiKey, encrypt: properties.encrypt}, context.keys.CLIENT_SECRET, { expiresIn: properties.expiration_time + 's' });

    return {ai_token: token, error: ""}
}