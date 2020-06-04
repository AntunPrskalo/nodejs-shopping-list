import bcrypt from 'bcrypt'
import { jwt_token, verify_token } from '../helpers/jwt'

const Mutation = {
    async register(parent, args, { UserModel }, info) {
        let user = await UserModel.findOne({
            'email': args.data.email
        })

        if (user) {
            throw new Error('Email taken.')
        }

        user = new UserModel(args.data)
        await user.save()

        return user
    },

    async login(parent, args, { UserModel }, info) {
        console.log(args)
        let user = await UserModel.findOne({
            'email': args.data.email
        })  
        
        if (!user) {
            throw new Error('User not found.')
        }

        let passwordsMatch = await bcrypt.compare(args.data.password, user.password)

        if (!passwordsMatch) {
            throw new Error('Password not correct.')
        }

        const token = jwt_token({
            '_id': user.id,
            'email': user.email
        })

        return {
            user,
            token
        }
    },

    async resetPassword(parent, args, { request, UserModel }, info) {
        const payload = verify_token(request)  
        
        const user = UserModel.findOne({
            '_id': payload._id
        })

        let passwordsMatch = await bcrypt.compare(args.data.currentPassword, user.password) 

        if (!passwordsMatch) {
            throw new Error('Password not correct')
        }

        user.isNew = false
        user.password = args.data.newPassword
        await user.save()

        return user
    },

    async createShoppingList(parent, args, { request, ShoppingListModel }, info) {
        const payload = verify_token(request)

        let shoppingList = await ShoppingListModel.findOne({
            'name': args.data.name,
            'user_id': payload._id
        })

        if (shoppingList) {
            throw new Error('Shopping List already exists.')
        }

        shoppingList = new ShoppingListModel({
            'name': args.data.name,
            'date': args.data.date,
            'user_id': payload._id,
            'products': args.data.products
        })

        await shoppingList.save()
        
        return shoppingList
    },

    async updateShoppingList(parent, args, { request, ShoppingListModel }, info) {
        const payload = verify_token(request)

        let shoppingList = await ShoppingListModel.findOne({
            'name': args.data.name,
            'user_id': payload._id
        })

        if (!shoppingList) {
            throw new Error('Shopping List not found.')
        }

        if (args.data.newName) {
            shoppingList.name = args.data.newName
        }

        if (args.data.date) {
            shoppingList.date = args.data.date
        }

        if (args.data.products) {
            shoppingList.products = args.data.products
        }

        shoppingList.isNew = false
        console.log(shoppingList)
        await shoppingList.save()

        return shoppingList
    },

    async deleteShoppingList(parent, args, { request, ShoppingListModel }, info) {
        const payload = verify_token(request)

        let shoppingList = await ShoppingListModel.findOne({
            'name': args.data.name,
            'user_id': payload._id
        })

        if (!shoppingList) {
            throw new Error('Shopping List not found.')
        }
        
        await ShoppingListModel.deleteOne({
            '_id': shoppingList._id
        })

        return shoppingList
    } 
}

export { Mutation }