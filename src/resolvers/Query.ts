import { jwt_token, verify_token } from '../helpers/jwt'
import { mongo } from 'mongoose';

const Query = {
    async shoppingLists(parent, args, { request, ShoppingListModel }, info) {
        const payload = verify_token(request)

        return ShoppingListModel.find({
            'user_id': payload._id,
        })
    },

    async report(parent, args, { request, ShoppingListModel }, info) {
        const payload = verify_token(request)
        let match = {};
    
        match["user_id"] = new mongo.ObjectId(payload._id);
    
        if (args.data.from || args.data.to) {
            match["date"] = {};
        }
    
        if (args.data.from) {
            if (isNaN(Date.parse(args.data.from))) {
                throw new Error('Invalid date.')
            }
    
            match["date"]["$gte"] = new Date(args.data.from);
        }
    
        if (args.data.to) {
            if (isNaN(Date.parse(args.data.to))) {
                throw new Error('Invalid date.')
            }
    
            match["date"]["$lt"] = new Date(args.data.to);   
        }

        return ShoppingListModel.aggregate([
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
        ])
    }
}

export { Query }