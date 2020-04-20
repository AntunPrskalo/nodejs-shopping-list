import User from '../model/user';
import { jwt_token, jwt_get_expiry_time, jwt_validate } from '../helpers/jwt'
import PromiseBreak from '../helpers/promise_break'
import { Error } from 'mongoose';

let express = require('express')
let router = express.Router();
const bcrypt = require('bcrypt');

router.post('/register', function (req, res) {
    const user = new User({
        email: req.body.email,
        password: req.body.password
    });

    user.checkUniqueness = true;
    user.save().then((result) => {
        return res.status(200).json({message: "Registration successful please log in."})
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return
        }

        console.log(err)

        if (err instanceof Error.ValidationError) {
            return res.status(400).json({message: "Validation error.", errors: User.parseValidationError(err)}) 
        }
        
        return res.status(500).json({message: "Unexpected server error."}) 
    });
})

router.post('/login', function (req, res) {
    const email = req.body.email
    const candidate_password = req.body.password
    let payload;

    const user = new User({
        email: req.body.email,
        password: req.body.password
    });

    user.checkUniqueness = false;
    user.validate()
    .then(result => {
        return User.findOne({"email": email})
    }).then(result => {
        if (!result) {
            res.status(400).json({message: "Authentication failed. User not found."})
            throw new PromiseBreak()
        }

        payload = {
            '_id': result._id,
            'email': result.email
        }

        return bcrypt.compare(candidate_password, result.password)
    })
    .then((result) => {
        if (!result) {
            res.status(400).json({message: "Authentication failed. Incorrect password."})
            throw new PromiseBreak()
        }

        let token = jwt_token(payload)
        res.cookie('token', token, {'maxAge': jwt_get_expiry_time() * 1000})
        return res.status(200).json({message: "Login successful.", token: token})
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return
        }
        console.log(err)

        if (err instanceof Error.ValidationError) {
            return res.status(400).json({message: "Validation error.", errors: User.parseValidationError(err)}) 
        }

        return res.status(500).json({message: "Unexpected server error."}) 
    });
})

router.post('/resetPassword', jwt_validate, function (req, res) {
    const user_id = req._id;
    const current_password = req.body.currentPassword
    const new_password = req.body.newPassword
    let user;

    if (!current_password) {
        return res.status(400).json({message: "Body parameter missing: 'currentPassword'."});
    }

    if (!new_password) {
        return res.status(400).json({message: "Body parameter missing: 'newPassword'."}); 
    }

    User.findOne({ "_id": user_id}).then((result) => {
        if (!result) {
            res.status(400).json({message: "Unexpected error. Unknown user."});
            throw new PromiseBreak();
        }

        user = result;
        user.isNew = false;

        return bcrypt.compare(current_password, user.password);
    })
    .then((result) => {
        if (!result) {
            res.status(400).json({ message: "Current password is not correct."})
            throw new PromiseBreak()
        }

        user.password = new_password
        user.checkUniqueness = false;
        return user.save();
    })
    .then(result => {
        return res.status(200).json({ message: "Password changed."})
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return
        }

        console.log(err)

        if (err instanceof Error.ValidationError) {
            return res.status(400).json({message: "Validation error.", errors: User.parseValidationError(err)}) 
        }

        return res.status(500).json({message: "Unexpected server error."}) 
    });
});

export default router;

