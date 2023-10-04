function(properties, context) {
    
 // get data
    var query = properties.query;
    var expiration_time = properties.expiration_time ? properties.expiration_time : 60;
    var api_key = properties.api_key;
    var encrypt = properties.encrypt;
    var client_secret = properties.client_secret;
    
 // checks
    if (!query) {
        return {
            ai_token: "",
            error: "Query is empty"
        }
    }
    
    if (!api_key) {
        return {
            ai_token: "",
            error: "AI API Key is empty"
        }
    }
    
    if (!client_secret) {
        return {
            ai_token: "",
            error: "Client Secret is empty"
        }
    }
    
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
    
    const crypto = require('crypto');
    const jwt = require("jsonwebtoken");
    const encryptedApiKey = encryptData(api_key, client_secret);
    
    function utf8_to_b64(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }
    
 // set params
    if (query) {
        var params = (encrypt ? encryptData(query, client_secret) : utf8_to_b64(query));
    }
    
 // sign the token
    var token = jwt.sign({
        params: params,
        api_key: encryptedApiKey,
        encrypt: encryptData
    }, client_secret, {
        expiresIn: expiration_time + 's'
    });
    
    return {
        ai_token: token,
        error: ""
    }
    
}