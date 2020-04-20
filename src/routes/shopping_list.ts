import ShoppingList from '../model/shopping_list';
import { jwt_validate } from '../helpers/jwt'
import PromiseBreak from '../helpers/promise_break'
import { Error, mongo } from 'mongoose';

let express = require('express')
let router = express.Router();

router.get('/shoppingLists', jwt_validate, function (req, res) {
    const user_id = req._id;

    ShoppingList.find({ "user_id": user_id}).then(result => {
        if (!result) {
            res.status(400).json({message: "Unexpected error. Unknown user."});
            throw new PromiseBreak();
        }
  
        return res.status(200).json(result);
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return;
        }

        console.log(err);
        return res.status(500).json({message: "Unexpected server error."});
    });
})

router.post('/shoppingList', jwt_validate, function (req, res) {
    const user_id = req._id;

    const shopping_list = new ShoppingList({
        name: req.body.name,
        date: req.body.date,
        user_id: user_id,
        products: req.body.products
    });

    shopping_list.save()
    .then((result) => {
        return res.status(200).json({message: "Shopping list created"})
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return;
        }

        console.log(err);

        if (err instanceof Error.ValidationError) {
            return res.status(400).json({message: "Validation error.", errors: ShoppingList.parseValidationError(err)});
        }
     
        return res.status(500).json({message: "Unexpected server error."});
    });
})

router.put('/shoppingList', jwt_validate, function (req, res) {
    const user_id = req._id;
    const list_name = req.body.name;
    const new_list_name = req.body.newName;
    const new_products = req.body.products;

    if (!list_name) {
        return res.status(400).json({message: "Body parameter missing: 'name'."});
    }

    ShoppingList.findOne({"user_id": user_id, "name": list_name}).then(shopping_list => {
        if (!shopping_list) {
            res.status(400).json({message: "Shopping list not found."});
            throw new PromiseBreak();
        }

        shopping_list.isNew = false;

        if (new_products) {
            shopping_list.products = new_products;
        }

        if (new_list_name) {
            shopping_list.name = new_list_name;
        }
  
        return shopping_list.save();
    }).then((result) => {

        return res.status(200).json({ message: "Shopping list updated."});
    })
    .catch((err) => {    
        if (err instanceof PromiseBreak) {
            return;
        }

        console.log(err);

        if (err instanceof Error.ValidationError) {
            return res.status(400).json({message: "Validation error.", errors: ShoppingList.parseValidationError(err)});
        }

        return res.status(500).json({message: "Unexpected server error."});
    });
})

router.delete('/shoppingList', jwt_validate, function (req, res) {
    const user_id = req._id;
    const list_name = req.body.name;


    if (!list_name) {
        return res.status(400).json({message: "Body parameter missing: 'name'."});   
    }

    ShoppingList.deleteOne({ "user_id": user_id, "name": list_name }).then(result => {
        if (!result || result.deletedCount == 0) {
            res.status(400).json({message: "Shopping list not found."});
            throw new PromiseBreak();
        }

        return res.status(200).json({message: "Shopping list deleted."});
    })
    .catch((err) => {
        if (err instanceof PromiseBreak) {
            return;
        }

        console.log(err);
        return res.status(500).json({message: "Unexpected server error."});
    });
})

router.get('/report', jwt_validate, function (req, res) {
    let user_id = req._id
    let from = req.query.from;
    let to = req.query.to;
    let match = {};

    match["user_id"] = new mongo.ObjectId(user_id);

    if (from || to) {
        match["date"] = {};
    }

    if (from) {
        if (isNaN(Date.parse(from))) {
            return res.status(400).json({ message: "Invalid date format."})
        }

        match["date"]["$gte"] = new Date(from);
    }

    if (to) {
        if (isNaN(Date.parse(to))) {
            return res.status(400).json({ message: "Invalid date format."})
        }

        match["date"]["$lt"] = new Date(to);   
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

