import mongoose from 'mongoose';
import { GraphQLServer, PubSub } from 'graphql-yoga'
import UserModel from './model/user'
import ShoppingListModel from './model/shopping_list'
import { Mutation } from './resolvers/Mutation'
import { Query } from './resolvers/Query'
import { DateType } from './resolvers/DateType'

const mongodb_uri: string = 'mongodb://root:password@localhost:27017'
const mongodb_database: string = 'nodejs'

const mongooseOps = {
    'useCreateIndex': true,
    'useNewUrlParser': true,
    'useUnifiedTopology': true,
    'dbName': mongodb_database
}

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers: {
        Mutation,
        Query,
        DateType
    },
    context(request) {
        return {
            request,
            UserModel,
            ShoppingListModel
        }
    }
})

mongoose.connect(mongodb_uri, mongooseOps).then((result) => {
    console.log('Connected to MongoDB.');
    return server.start()
}).then((result) => {
    console.log('GraphQL server is running.');
}).catch((error) => {
    console.log(error)
});