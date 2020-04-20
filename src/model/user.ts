import { model, Schema, Error} from 'mongoose';
import bcrypt from 'bcrypt'; 

const saltRounds = 10;  
const email_regex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

interface IUser extends Document {
    email: string,
    password: string
}

async function validateUniqueEmail() {
    if (this.checkUniqueness && this.isModified('email')) {
        let result = await this.constructor.findOne({"email": this.email})

        if (result) {
            throw new Error('User already exists.');
        }
    }

    return true
}

function validateEmail() {
    if (this.isModified('email') && !this.email.match(email_regex)) {
        throw new Error('Invalid email address.');
    }

    return true
}

function validatePassword() {
    if (this.isModified('password') && this.password.length < 5) {
        throw new Error('Password cannot have less than 5 characters');
    }

    return true
}

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true, validate: [
        {validator: validateEmail}, 
        {validator: validateUniqueEmail}
    ]},
    password: { type: String, required: true, validate: validatePassword},
})

UserSchema.pre<IUser>("save", async function(next) {
    if (this.isModified("password")) {
        this.password  = await bcrypt.hash(this.password, saltRounds)    
    }

    next()
});

UserSchema.statics.parseValidationError = function (error: Error.ValidationError): Array<Object> {
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

UserSchema.virtual('checkUniqueness')
    .get(function() {return this._checkUniqueness;})
    .set(function(checkUniqueness) {return this._checkUniqueness = checkUniqueness});
  
export default model<IUser>("User", UserSchema)
