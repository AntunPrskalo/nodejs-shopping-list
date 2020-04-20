import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import user_router from './routes/user';
import shopping_list_router from './routes/shopping_list';

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/', user_router);
app.use('/', shopping_list_router);

const mongodb_uri: string = process.env.MONGODB_URI
const mongodb_database: string = process.env.MONGODB_DATABASE

mongoose.connect(mongodb_uri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: mongodb_database
}).then(function (result) {
    console.log('[SUCCESS] Connected to MongoDB');
    app.listen(8000)
}).catch((error) => {
    console.log(error)
});

module.exports = app