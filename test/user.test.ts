export { }
process.env.NODE_ENV = 'test';
console.log(__dirname)
//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');
const randomstring = require('randomstring');
const sinon = require('sinon');
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

const should = chai.should();
const privateKEY  = fs.readFileSync(path.join(__dirname, '../jwtRS256.key'), 'utf8');
const publicKEY  = fs.readFileSync(path.join(__dirname, '../jwtRS256.key.pub'), 'utf8');

//sinon.stub(console, "log")
chai.use(chaiHttp);

describe('User Routes Test', () => {
    let registered_user;
    let registered_password;
    let registered_user_token;
    let invalid_token = randomstring.generate(10);
    let expired_token = jwt.sign({
        "_id": randomstring.generate(7),
        "email": randomstring.generate(7),
    }, privateKEY, {
        'issuer': 'Shopping List API',
        'expiresIn': 0,
        'algorithm':  'RS256',
    });

    describe('POST /register', () => {

        it('Register user success.', (done) => {
            const user_valid = randomstring.generate(7) + "@gmail.com";
            const password_valid = randomstring.generate(7);
            registered_user = user_valid;
            registered_password = password_valid;

            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": user_valid, "password": password_valid }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.eql({ message: "Registration successful please log in." })
                    done();
                });
        });

        it('Register user fail. Missing "email" field.', (done) => {
            const password_valid = randomstring.generate(7);

            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "password": password_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'email', err_msg: 'Path `email` is required.' }]
                    })
                    done();
                });
        });

        it('Register user fail. Missing "password" field.', (done) => {
            const user_valid = randomstring.generate(7) + "@gmail.com";

            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": user_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'password', err_msg: 'Path `password` is required.' }]
                    })
                    done();
                });
        });

        it('Register user fail. Invalid email.', (done) => {
            const user_invalid = randomstring.generate(7);
            const password_valid = randomstring.generate(7);

            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": user_invalid, "password": password_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'email', err_msg: 'Invalid email address.', "value": user_invalid }]
                    })
                    done();
                });
        });

        it('Register user fail. Password too short.', (done) => {
            const user_valid = randomstring.generate(7) + "@gmail.com";
            const password_invalid = randomstring.generate(4);

            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ 'email': user_valid, "password": password_invalid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'password', err_msg: 'Password cannot have less than 5 characters', "value": password_invalid }]
                    })
                    done();
                });
        });

        it('Register user fail. User already exists.', (done) => {
            const password_valid = randomstring.generate(7);

            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ 'email': registered_user, "password": password_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'email', err_msg: 'User already exists.', 'value': registered_user }]
                    })
                    done();
                });
        });

        it('Register user fail. Multiple error.', (done) => {
            chai.request(app)
                .post('/register')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ 'email': registered_user }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Validation error.');
                    res.body.should.have.property('errors')
                    res.body['errors'].should.be.an('array')
                    res.body['errors'].should.deep.include.members([
                        { field: 'password', err_msg: 'Path `password` is required.' },
                        { field: 'email', err_msg: 'User already exists.', 'value': registered_user }
                    ]);
                    done();
                });
        });
    });


    describe('POST /login', () => {
        it('Login success.', (done) => {
            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": registered_user, "password": registered_password }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Login successful.');
                    res.body.should.have.property('token').and.be.a('string')
                    done();

                    registered_user_token = res.body.token
                });
        });

        it('Login fail. Incorrect password.', (done) => {
            const rand_password = randomstring.generate(7);

            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": registered_user, "password": rand_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Authentication failed. Incorrect password.');
                    done();
                });
        });

        it('Login fail. Unknown user.', (done) => {
            const rand_user = randomstring.generate(7) + "@gmail.com";
            const rand_password = randomstring.generate(7);

            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": rand_user, "password": rand_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Authentication failed. User not found.');
                    done();
                });
        });

        it('Login fail. Missing "email" field.', (done) => {
            const password_valid = randomstring.generate(7);

            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "password": password_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'email', err_msg: 'Path `email` is required.' }]
                    })
                    done();
                });
        });

        it('Login fail. Missing "password" field.', (done) => {
            const user_valid = randomstring.generate(7) + "@gmail.com";

            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": user_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'password', err_msg: 'Path `password` is required.' }]
                    })
                    done();
                });
        });

        it('Login fail. Invalid email.', (done) => {
            const user_invalid = randomstring.generate(7);
            const password_valid = randomstring.generate(7);

            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "email": user_invalid, "password": password_valid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'email', err_msg: 'Invalid email address.', "value": user_invalid }]
                    })
                    done();
                });
        });

        it('Login fail. Password too short.', (done) => {
            const user_valid = randomstring.generate(7) + "@gmail.com";
            const password_invalid = randomstring.generate(4);

            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ 'email': user_valid, "password": password_invalid }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'password', err_msg: 'Password cannot have less than 5 characters', "value": password_invalid }]
                    })
                    done();
                });
        });

        it('Login fail. Multiple error.', (done) => {
            chai.request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({}))
                .end((err, res) => {
                    console.log(res.body)
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Validation error.');
                    res.body.should.have.property('errors')
                    res.body['errors'].should.be.an('array')
                    res.body['errors'].should.deep.include.members([
                        { field: 'password', err_msg: 'Path `password` is required.' },
                        { field: 'email', err_msg: 'Path `email` is required.' }
                    ]);
                    done();
                });
        });
    });

    describe('POST /resetPassword', () => {
        const new_password = randomstring.generate(7);

        it('Reset password success.', (done) => {
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "currentPassword": registered_password, "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Password changed.');

                    registered_password = new_password
                    done();
                });
        });

        it('Reset password fail. Unauthorized. Token missing.', (done) => {
            const new_password = randomstring.generate(7);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({ "currentPassword": registered_password, "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it('Reset password fail. Unauthorized. Invalid token.', (done) => {
            const new_password = randomstring.generate(7);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', invalid_token)
                .send(JSON.stringify({ "currentPassword": registered_password, "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it('Reset password fail. Unauthorized. Expired token.', (done) => {
            const new_password = randomstring.generate(7);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', expired_token)
                .send(JSON.stringify({ "currentPassword": registered_password, "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it('Reset password fail. Incorrect current password.', (done) => {
            const new_password = randomstring.generate(7);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "currentPassword": new_password, "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Current password is not correct.");
                    done();
                });
        });

        it('Reset password fail. Body parameter missing: currentPassword.', (done) => {
            const new_password = randomstring.generate(7);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Body parameter missing: 'currentPassword'.");
                    done();
                });
        });

        it('Reset password fail. Body parameter missing: newPassword.', (done) => {
            const new_password = randomstring.generate(7);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "currentPassword": registered_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Body parameter missing: 'newPassword'.");
                    done();
                });
        });

        it('Reset password fail. Password too short.', (done) => {
            const new_password = randomstring.generate(4);
            chai.request(app)
                .post('/resetPassword')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "currentPassword": registered_password, "newPassword": new_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'password', err_msg: 'Password cannot have less than 5 characters', "value": new_password }]
                    })
                    done();
                });
        });
    });
});