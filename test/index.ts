export { }
process.env.NODE_ENV = 'test';
console.log(__dirname)
//Require the dev-dependencies
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app/app');
const should = chai.should();

chai.use(chaiHttp);
describe('Simple Route Test', () => {

  const test_user = 'test@gmail.com'
  const test_pass = '12345'

  describe('POST /register', () => {
    it('Register user success.', (done) => {
      chai.request(app)
        .post('/register')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({"email":test_user, "password": test_pass}))
        .end((err, res) => {
          console.log(res)
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.includes.all.keys([ 'id', 'category', 'tenant' ])
          done();
        });
    });
  });
});