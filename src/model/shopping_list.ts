import { model, Schema, Types, Error } from 'mongoose';

interface IList extends Document {
    name: string,
    id: string,
    user_id: Types.ObjectId,
    date: Date,
    products: Array<IProduct>
}

interface IProduct extends Document {
    name: string,
    amount: number
}

const ShoppingListSchema: Schema = new Schema({
    name: { type: String, required: true},
    user_id: { type: Schema.Types.ObjectId, required: true},
    date: {type: Date, default: Date.now()},
    products: [{
        name:  {type: String, required: true},
        amount:  {type: Number, required: true}
    }]
}, { versionKey: false });
  
export default model<IList>("ShoppingList", ShoppingListSchema)