import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

// ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
const privateKEY  = fs.readFileSync(path.join(__dirname, '../../jwtRS256.key'), 'utf8');
const publicKEY  = fs.readFileSync(path.join(__dirname, '../../jwtRS256.key.pub'), 'utf8');

const opt = {
    'issuer': 'Shopping List API',
    'expiresIn': 30 * 60,
    'algorithm':  'RS256',
}

export const jwt_token = function(payload) {
    return jwt.sign(payload, privateKEY, opt);
}

export const jwt_verify = function(token) {
    return jwt.verify(token, publicKEY, opt);
}

export const jwt_get_expiry_time = function() {
    return opt.expiresIn
} 