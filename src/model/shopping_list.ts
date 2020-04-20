import { model, Schema, Types, Error } from 'mongoose';

interface IList extends Document {
    name: string,
    id: string,
    user_id: Types.ObjectId,
    date: string,
    products: Array<IProduct>
}

interface IProduct extends Document {
    name: string,
    amount: number
}

async function validateUniqueName() {

    if (this.isModified('name')) {
        let result = await this.constructor.findOne({"user_id": this.user_id, "name": this.name})

        if (result) {
            throw new Error('Shopping list already exists.');
        }
    }

    return true
}

const ShoppingListSchema: Schema = new Schema({
    name: { type: String, required: true, validate: validateUniqueName},
    user_id: { type: Schema.Types.ObjectId, required: true},
    date: {type: Date, default: Date.now()},
    products: [{
        name:  {type: String, required: true},
        amount:  {type: Number, required: true}
    }]
}, { versionKey: false });
  
ShoppingListSchema.statics.parseValidationError = function (error: Error.ValidationError): Array<Object> {
    let response_arr = []
    for (let prop in error.errors) {
        let response_ob = {};
        response_ob['field'] = prop;
        response_ob['value'] = error.errors[prop].value;
        response_ob['err_msg'] = error.errors[prop].message;
        response_arr.push(response_ob)
    }

    return response_arr;
}

export default model<IList>("ShoppingList", ShoppingListSchema)