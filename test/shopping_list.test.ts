export { }
process.env.NODE_ENV = 'test';
console.log(__dirname)
//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/app');
const randomstring = require('randomstring');
const sinon = require('sinon');
const should = chai.should();

sinon.stub(console, "log")
chai.use(chaiHttp);


describe('Shopping List Routes Test', () => {
    let registered_user;
    let registered_password;
    let registered_user_token;
    let shopping_list_empty_name = randomstring.generate(7)
    let shopping_list_non_empty_name = randomstring.generate(7)

    before(function (done) {
        const user_valid = randomstring.generate(7) + "@gmail.com";
        const password_valid = randomstring.generate(7);

        chai.request(app)
            .post('/register')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ "email": user_valid, "password": password_valid }))
            .end((err, res) => {
                res.should.have.status(200);
                registered_user = user_valid
                registered_password = password_valid

                chai.request(app)
                    .post('/login')
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify({ "email": user_valid, "password": password_valid }))
                    .end((err, res) => {
                        res.should.have.status(200);
                        registered_user_token = res.body.token
                        done();
                    });
            });
    });

    describe('POST /shoppingList', () => {
        it('Create empty shopping lists success.', (done) => {
            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "name": shopping_list_empty_name }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list created");
                    done();
                });
        });

        it('Create shopping list with products success.', (done) => {
            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "name": "product_01", "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list created");
                    done();
                });
        });

        it('Create shopping list fail. Unauthorized. Token missing.', (done) => {
            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "name": "product_01", "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it("Create shopping lists fail. Missing 'name' field.", (done) => {
            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "products": [
                        { "name": "product_01", "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'name', err_msg: 'Path `name` is required.' }]
                    })
                    done();
                });
        });

        it("Create shopping lists fail. Missing product 'name' field.", (done) => {
            const rand_list_name = randomstring.generate(7)

            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": rand_list_name,
                    "products": [
                        { "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'name', err_msg: 'Path `name` is required.' }]
                    })
                    done();
                });
        });

        it("Create shopping lists fail. Missing product 'amount' field.", (done) => {
            const rand_list_name = randomstring.generate(7)

            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": rand_list_name,
                    "products": [
                        { "name": "product_01" },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'amount', err_msg: 'Path `amount` is required.' }]
                    })
                    done();
                });
        });

        it("Create shopping lists fail. Product 'amount' parse error.", (done) => {
            const rand_list_name = randomstring.generate(7)

            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": rand_list_name,
                    "products": [
                        { "name": "product_01", "amount": "str" },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'amount', err_msg: 'Cast to Number failed for value \"str\" at path \"amount\"', value: "str" }]
                    })
                    done();
                });
        });

        it("Create shopping lists fail. Shopping list already exists.", (done) => {
            chai.request(app)
                .post('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "name": shopping_list_empty_name }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'name', err_msg: 'Shopping list already exists.', value: shopping_list_empty_name }]
                    })
                    done();
                });
        });
    });

    describe('GET /shoppingLists', () => {
        it('Get shopping lists success.', (done) => {
            chai.request(app)
                .get('/shoppingLists')
                .set('token', registered_user_token)
                .send(JSON.stringify({ "email": registered_user, "password": registered_password }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array')
                    res.body.should.have.length(2);
                    let checked = 0

                    for (let i = 0; i < res.body.length; i++) {
                        res.body[i].should.have.property('_id').and.to.be.a('string')
                        res.body[i].should.have.property('name').and.to.be.a('string')
                        res.body[i].should.have.property('date').and.to.be.a('string')
                        res.body[i].should.have.property('user_id').and.to.be.a('string')
                        res.body[i].should.have.property('products').and.to.be.a('array')

                        if (res.body[i]['name'] == shopping_list_empty_name) {
                            res.body[i]['products'].should.have.length(0);
                            checked++;
                        }
                        else if (res.body[i]['name'] == shopping_list_non_empty_name) {
                            res.body[i]['products'].should.have.length(2);
                            checked++;

                            for (let j = 0; j < res.body[i]['products'].length; j++) {
                                res.body[i]['products'][j].should.have.property('_id').and.to.be.a('string')
                                res.body[i]['products'][j].should.have.property('name').and.to.be.a('string')
                                res.body[i]['products'][j].should.have.property('amount').and.to.be.a('number')
                                checked++;
                            }
                        }
                    }

                    checked.should.be.eq(4)
                    done();
                });
        });

        it('Get shopping lists fail. Unauthorized. Token missing.', (done) => {
            chai.request(app)
                .get('/shoppingLists')
                .send(JSON.stringify({ "email": registered_user, "password": registered_password }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });
    });

    describe('PUT /shoppingList', () => {
        const rand_list_name = randomstring.generate(7)

        it('Update shopping list name success.', (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "newName": rand_list_name
                }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list updated.");

                    shopping_list_non_empty_name = rand_list_name
                    done();
                });
        });

        it('Update shopping list products success.', (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "name": "product_01", "amount": 2 },
                        { "name": "product_02", "amount": 2 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list updated.");

                    shopping_list_non_empty_name = rand_list_name
                    done();
                });
        });

        it('Update shopping list fail. Unauthorized. Token missing.', (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "name": "product_01", "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it('Update shopping list fail. Body parameter missing: "name".', (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "products": [
                        { "name": "product_01", "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    console.log(res.body)
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Body parameter missing: 'name'.");
                    done();
                });
        });

        it('Update shopping list fail. Not found.', (done) => {
            const rand_list_name = randomstring.generate(7);

            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": rand_list_name,
                    "products": [
                        { "name": "product_01", "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list not found.");
                    done();
                });
        });

        it("Update shopping lists fail. Missing product 'name' field.", (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "amount": 1 },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'name', err_msg: 'Path `name` is required.' }]
                    })
                    done();
                });
        });

        it("Update shopping lists fail. Missing product 'amount' field.", (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "name": "product_01" },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'amount', err_msg: 'Path `amount` is required.' }]
                    })
                    done();
                });
        });

        it("Update shopping lists fail. Product 'amount' parse error.", (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name,
                    "products": [
                        { "name": "product_01", "amount": "str" },
                        { "name": "product_02", "amount": 1 }
                    ]
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'amount', err_msg: 'Cast to Number failed for value \"str\" at path \"amount\"', value: "str" }]
                    })
                    done();
                });
        });

        it("Update shopping lists fail. Shopping list already exists.", (done) => {
            chai.request(app)
                .put('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_empty_name,
                    "newName": shopping_list_non_empty_name
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.eql({
                        "message": 'Validation error.',
                        "errors": [{ field: 'name', err_msg: 'Shopping list already exists.', value: shopping_list_non_empty_name }]
                    })
                    done();
                });
        });
    });

    describe('GET /report', () => {

        it("Get shopping lists report success. Dates valid.", (done) => {
            chai.request(app)
                .get('/report?from=2019-01-01T00:00:00Z&to=2021-01-01T00:00:00Z')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .end((err, res) => {
                    console.log("------------------")
                    console.log(res.body)
                    res.should.have.status(200);
                    res.body.should.be.an('array')
                    res.body.should.have.length(2);

                    for (let i = 0; i < res.body.length; i++) {
                        res.body[i].should.have.property('total_amount').and.to.be.a('number').and.to.eq(2)
                        res.body[i].should.have.property('product_name').and.to.be.a('string')
                    }

                    done();
                });
        });

        it("Get shopping lists report success. Without date parameters.", (done) => {
            chai.request(app)
                .get('/report')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('array')
                    res.body.should.have.length(2);

                    for (let i = 0; i < res.body.length; i++) {
                        res.body[i].should.have.property('total_amount').and.to.be.a('number').and.to.eq(2)
                        res.body[i].should.have.property('product_name').and.to.be.a('string')
                    }

                    done();
                });
        });

        it('Get shopping lists report fail. Unauthorized. Token missing.', (done) => {
            chai.request(app)
                .get('/report')
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it("Get shopping lists report fail. Date parse error.", (done) => {
            chai.request(app)
                .get('/report?from=2019-01-01T00:00:00Z&to=str')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Invalid date format.");
                    done();
                });
        });
    });

    describe('DELETE /shoppingList', () => {

        it("Delete shopping lists success", (done) => {
            chai.request(app)
                .delete('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": shopping_list_empty_name
                }))
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list deleted.");
                    done();
                });
        });

        it('Delete shopping lists fail. Unauthorized. Token missing.', (done) => {
            chai.request(app)
                .delete('/shoppingList')
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({
                    "name": shopping_list_non_empty_name
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql('Forbidden. Not authorized.');
                    done();
                });
        });

        it("Delete shopping lists fail. List not found.", (done) => {
            const rand_list_name = randomstring.generate(7);

            chai.request(app)
                .delete('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": rand_list_name
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list not found.");
                    done();
                });
        });

        it("Delete shopping lists fail. List not found.", (done) => {
            const rand_list_name = randomstring.generate(7);

            chai.request(app)
                .delete('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({
                    "name": rand_list_name
                }))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Shopping list not found.");
                    done();
                });
        });

        it("Delete shopping lists fail. Body parameter missing: 'name'.", (done) => {
            chai.request(app)
                .delete('/shoppingList')
                .set('Content-Type', 'application/json')
                .set('token', registered_user_token)
                .send(JSON.stringify({}))
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('message').and.to.be.eql("Body parameter missing: 'name'.");
                    done();
                });
        });
    });
});
