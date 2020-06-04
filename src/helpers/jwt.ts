import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

// ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
const privateKEY  = fs.readFileSync(path.join(__dirname, '../../jwtRS256.key'), 'utf8');
const publicKEY  = fs.readFileSync(path.join(__dirname, '../../jwtRS256.key.pub'), 'utf8');

const opt = {
    'issuer': 'Shopping List API',
    'expiresIn': (!isNaN(parseInt(process.env.JWT_TTL_SECONDS))) ? parseInt(process.env.JWT_TTL_SECONDS) : 10000*60,
    'algorithm':  'RS256',
}

export const jwt_validate = function(req, res, next) {
    let token = (req.headers.token) ? req.headers.token: req.cookies.token

    if (!token) {
        return res.status(400).json({message: "Forbidden. Not authorized."})
    }

    try {
        const payload = jwt.verify(token, publicKEY, opt);
        req._id = payload._id;
        req.email = payload.email;
    } catch (e) {
        return res.status(400).json({message: "Forbidden. Not authorized."})
    }

    next()
}


export const jwt_token = function(payload) {
    return jwt.sign(payload, privateKEY, opt);
}

export const jwt_get_expiry_time = function() {
    return opt.expiresIn
} 

export const verify_token = (request) => {
    const token = request.request.headers.token

    if (!token) {
        throw new Error('Authorization required.')
    }

    return jwt.verify(token, publicKEY, opt)
}