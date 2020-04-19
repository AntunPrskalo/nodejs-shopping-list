import mongoose from 'mongoose';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import router from './routes/index';

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/', router);

const mongodb_uri: string = 'mongodb://root:password@localhost:27018' //process.env.MONGODB_URI

mongoose.connect(mongodb_uri, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(function (result) {
    console.log('[SUCCESS] Connected to MongoDB');
    app.listen(8000)
}).catch((error) => {
    console.log(error)
});

module.exports = app