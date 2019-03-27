//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const app = require('../app');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');

const should = chai.should();
const Users = mongoose.model('Users');

chai.use(chaiHttp);

describe('Users', () => {
    afterEach(async () => {
        await Users.deleteMany();        
    });

    describe('/GET current user', () => {
        it('it should GET a 401 http code as a result because the request does not have the token', async () => {
            let res = await chai.request(app).get('/api/users/current')
            
            res.should.have.status(401);
            res.body.errors.message.should.be.eql("No authorization token was found");
            res.body.errors.error.name.should.be.eql("UnauthorizedError");
            res.body.errors.error.code.should.be.eql("credentials_required");
            res.body.errors.error.status.should.be.eql(401);
        });

        it('it should GET a 200 http code as a result and a user because we set the correct token', async () => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let res = await chai.request(app).get('/api/users/current').set("Authorization", "Token " + user.generateJWT());
            
            res.should.have.status(200);
            res.body.should.have.property("user");
            res.body.user.should.have.property("firstname");
            res.body.user.firstname.should.be.eql("p");
            res.body.user.should.have.property("name");
            res.body.user.name.should.be.eql("r");
            res.body.user.should.have.property("email");
            res.body.user.email.should.be.eql("r@gmail.com");
            res.body.user.should.have.property("token");
        });
    });

    describe('/POST createUser', () => {
        it('it should POST a user because all the fields exist', async () => {
            let user = { name: "t", firstname: "paul", email: "paul.t@mail.com", password: "test" };

            let res = await chai.request(app).post('/api/users').send({ user:user });

            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('user');
            res.body.user.should.have.property('name');
            res.body.user.should.have.property('firstname');
            res.body.user.should.have.property('email');
            res.body.user.should.have.property('token');
            res.body.user.name.should.be.eql(user.name);
            res.body.user.firstname.should.be.eql(user.firstname);
            res.body.user.email.should.be.eql(user.email);  
        });
        
        it('it should not POST a new user when name field is missing', async () => {
            let user = {
                firstname: "paul",
                password: "test",
                email: "paul.t@mail.com"
            };
            
            let res = await chai.request(app).post('/api/users').send({user:user});
            
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('name');
            res.body.errors.name.should.be.eql('isrequired');
        });

        it('it should not POST a new user when firstname field is missing', async () => {
            let user = {
                name: "t",
                password: "test",
                email: "paul.t@mail.com"
            };

            let res = await chai.request(app).post('/api/users').send({user:user});
            
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('firstname');
            res.body.errors.firstname.should.be.eql('isrequired');
        });

        it('it should not POST a new user when password field is missing', async () => {
            let user = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let res = await chai.request(app).post('/api/users').send({user:user})
            
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('password');
            res.body.errors.password.should.be.eql('isrequired');
        });

        it('it should not POST a new user when email field is missing', async () => {
            let user = {
                name: "t",
                firstname: "paul",
                password: "test",
            };

            let res = await chai.request(app).post('/api/users').send({user:user})
            
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('email');
            res.body.errors.email.should.be.eql('isrequired'); 
        });

        it('it should not POST a new user when an email is duplicated', async () => {
            let jsonUser = { name: "t", firstname: "paul", email: "paul.t@mail.com" };
            let user = new Users(jsonUser);
            user.setPassword("test");
            user = await user.save();

            jsonUser.password = "test";

            let res = await chai.request(app).post('/api/users').send({user:jsonUser})
                
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('email');
            res.body.errors.email.should.be.eql('alreadyexisting');
        });
    });

    describe('/POST login', () => {
        it('it should login because the password is correct and the email is verified', async () => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com",
                isVerified: true
            };

            let user = new Users(jsonuser);
            user.setPassword("test");
            user = await user.save();

            let res = await chai.request(app).post('/api/users/login').send({user:{ email:"paul.t@mail.com", password:"test"}});
            
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('user');
            res.body.user.should.have.property('name');
            res.body.user.should.have.property('firstname');
            res.body.user.should.have.property('email');
            res.body.user.should.have.property('token');
            res.body.user.name.should.be.eql(user.name);
            res.body.user.firstname.should.be.eql(user.firstname);
            res.body.user.email.should.be.eql(user.email);
        });

        it('it should not login because the password is correct and the email is not verified', async () => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com",
                isVerified: false
            };

            let user = new Users(jsonuser);
            user.setPassword("test");
            user = await user.save();

            let res = await chai.request(app).post('/api/users/login').send({user:{ email:"paul.t@mail.com", password:"test"}});
            
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('email');
            res.body.errors.email.should.be.eql('needVerification');
        });

        it('it should not login because the password is incorrect', async () => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com",
                isVerified: true
            };

            let user = new Users(jsonuser);
            user.setPassword("test");
            user = await user.save();

            let res = await chai.request(app).post('/api/users/login').send({user:{ email:"paul.t@mail.com", password:"t"}})
               
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('password');
            res.body.errors.password.should.be.eql('invalid');
        });

        it('it should not login because the email is unknown', async () => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");
            user = await user.save();
                
            let res = await chai.request(app).post('/api/users/login').send({user:{ email:"p.t@mail.com", password:"t"}})
                
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('email');
            res.body.errors.email.should.be.eql('invalid');      
        });

        it('it should not login because the email is missing', async () => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");
            user = await user.save();

            let res = await chai.request(app).post('/api/users/login').send({user:{ password:"t"}})
                
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('email');
            res.body.errors.email.should.be.eql('isrequired');
        });

        it('it should not login because the password is missing', async () => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");

            user = await user.save();

            let res = await chai.request(app).post('/api/users/login').send({user:{ email:"paul.t@mail.com" }})
                
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('password');
            res.body.errors.password.should.be.eql('isrequired');
        });
    });
});