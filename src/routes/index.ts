import User from '../model/user';
import ShoppingList from '../model/shopping_list';
import { jwt_token, jwt_verify, jwt_get_expiry_time } from '../helpers/jwt'
import PromiseBreak from '../helpers/promise_break'
import { Error, mongo } from 'mongoose';

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
            return res.status(500).json({message: "Validation error.", errors: User.parseValidationError(err)}) 
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
            res.status(400).json({message: "Authentication failed. User not found"})
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
            return res.status(500).json({message: "Validation error.", errors: User.parseValidationError(err)}) 
        }

        return res.status(500).json({message: "Unexpected server error."}) 
    });
})

router.post('/resetPassword', function (req, res) {
    let payload
    let token = (req.headers.token) ? req.headers.token: req.cookies.token
    const current_password = req.body.currentPassword
    const new_password = req.body.newPassword
    let user;

    if (!token) {
        return res.status(400).json({message: "Forbidden. Not authorized."})
    }

    try {
        payload = jwt_verify(token)
    } catch (e) {
        return res.status(400).json({message: "Forbidden. Not authorized."})
    }

    if (!current_password) {
        return res.status(400).json({message: "Body parameter missing: 'currentPassword'."})    
    }

    if (!new_password) {
        return res.status(400).json({message: "Body parameter missing: 'newPassword'."})    
    }

    User.findOne({ "_id": payload._id }).then((result) => {
        if (!result) {
            res.status(400).json({message: "Unexpected error. Unknown user."})
            throw new PromiseBreak()
        }

        user = result
        user.isNew = false

        return bcrypt.compare(current_password, user.password)
    })
    .then((result) => {
        if (!result) {
            res.status(400).json({ message: "Current password is not correct."})
            throw new PromiseBreak()
        }

        user.password = new_password
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
            return res.status(500).json({message: "Validation error.", errors: User.parseValidationError(err)}) 
        }

        return res.status(500).json({message: "Unexpected server error."}) 
    });
});

router.get('/shoppingLists', function (req, res) {
    let payload
    let token = (req.headers.token) ? req.headers.token: req.cookies.token

    if (!token) {
        return res.status(400).json({ message: "Forbidden. Not authorized." })
    }

    try {
        payload = jwt_verify(token)
    } catch (e) {
        return res.status(400).json({ message: "Forbidden. Not authorized." })
    }

    ShoppingList.find({ "user_id": payload._id }).then(result => {
        if (!result) {
            res.status(400).json({message: "Unexpected error. Unknown user."})
            throw new PromiseBreak()
        }
  
        return res.status(200).json(result)
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return
        }

        console.log(err)
        return res.status(500).json({message: "Unexpected server error."}) 
    });
})

router.post('/shoppingList', function (req, res) {
    let payload
    let token = (req.headers.token) ? req.headers.token: req.cookies.token

    if (!token) {
        return res.status(400).json({ message: "Forbidden. Not authorized." })
    }

    try {
        payload = jwt_verify(token)
    } catch (e) {
        return res.status(400).json({ message: "Forbidden. Not authorized." })
    }

    const shopping_list = new ShoppingList({
        name: req.body.name,
        date: req.body.date,
        user_id: payload._id,
        products: req.body.products
    });

    shopping_list.save()
    .then((result) => {
        return res.status(200).json({message: "Shopping list created"})
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return
        }

        console.log(err)

        if (err instanceof Error.ValidationError) {
            return res.status(500).json({message: "Validation error.", errors: ShoppingList.parseValidationError(err)}) 
        }
     
        return res.status(500).json({message: "Unexpected server error."}) 
    });
})

router.put('/shoppingList', function (req, res) {
    let payload;
    let token = (req.headers.token) ? req.headers.token: req.cookies.token
    const list_name = req.body.name;
    const new_list_name = req.body.new_name;
    const new_products = req.body.products;

    if (!token) {
        return res.status(400).json({message: "Forbidden. Not authorized." });
    }

    try {
        payload = jwt_verify(token);
    } catch (e) {
        return res.status(400).json({message: "Forbidden. Not authorized." });
    }

    ShoppingList.findOne({"user_id": payload._id, "name": list_name}).then(shopping_list => {
        if (!shopping_list) {
            res.status(400).json({message: "Shopping list not found."});
            throw new PromiseBreak();
        }

        shopping_list.isNew = false;

        if (new_products) {
            shopping_list.products = new_products
        }

        if (new_list_name) {
            shopping_list.name = new_list_name
        }
  
        return shopping_list.save();
    }).then((result) => {

        return res.status(200).json({ message: "Shopping list updated"})
    })
    .catch((err) => {    
        if (err instanceof PromiseBreak) {
            return
        }

        console.log(err)

        if (err instanceof Error.ValidationError) {
            return res.status(500).json({message: "Validation error.", errors: ShoppingList.parseValidationError(err)}) 
        }

        return res.status(500).json({message: "Unexpected server error."}) 
    });
})

router.delete('/shoppingList', function (req, res) {
    let payload;
    let token = (req.headers.token) ? req.headers.token: req.cookies.token
    const list_name = req.body.name;

    if (!token) {
        return res.status(400).json({ message: "Forbidden. Not authorized." });
    }

    try {
        payload = jwt_verify(token);
    } catch (e) {
        return res.status(400).json({ message: "Forbidden. Not authorized." });
    }

    if (!list_name) {
        return res.status(400).json({message: "Body parameters missing: 'name'."})    
    }

    ShoppingList.deleteOne({ "user_id": payload._id, "name": list_name }).then(result => {
        if (!result || result.deletedCount == 0) {
            res.status(500).json({message: "Shopping list not found."});
            throw new PromiseBreak();
        }

        return res.status(200).json({message: "Shopping list deleted"});
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return
        }

        console.log(err);
        return res.status(500).json({message: "Unexpected server error."});
    });
})

router.get('/report', function (req, res) {
    let payload;
    let token = (req.headers.token) ? req.headers.token: req.cookies.token;
    let from = req.query.from;
    let to = req.query.to;
    let match = {};

    if (!token) {
        return res.status(400).json({ message: "Forbidden. Not authorized." });
    }

    try {
        payload = jwt_verify(token);
    } catch (e) {
        return res.status(400).json({ message: "Forbidden. Not authorized." });
    }

    match["user_id"] = new mongo.ObjectId(payload._id);

    if (from || to) {
        match["date"] = {};
    }

    try {
        if (from) {
            match["date"]["$gte"] = new Date(from);
        }

        if (to) {
            match["date"]["$lt"] = new Date(to);  
        }
    }
    catch (e) {
        return res.status(400).json({ message: "Invalid date format."})
    }

    ShoppingList.aggregate([
        {
            "$match": match
        },
        { "$unwind": "$products" },
        {
            "$group": {
                "_id": "$products.name",
                "total_amount": { "$sum": "$products.amount" }
            }
        },
        {
            "$project": {
                "_id": 0,
                "product_name": "$_id",
                "total_amount": 1
            }
        }
    ]).then((result) => {
        return res.status(200).json(result);
    })
    .catch((err) => {
        console.log(err);
        return res.status(500).json({message: "Unexpected server error."});
    });
});

export default router;

