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
    beforeEach((done) => {
        Users.deleteMany({}, (err) => { 
           done();           
        });        
    });

    describe('/GET current user', () => {
        it('it should GET a 401 http code as a result because the request does not have the token', (done) => {
        chai.request(app)
            .get('/api/users/current')
            .end((err, res) => {
                    res.should.have.status(401);
                    res.body.errors.message.should.be.eql("No authorization token was found");
                    res.body.errors.error.name.should.be.eql("UnauthorizedError");
                    res.body.errors.error.code.should.be.eql("credentials_required");
                    res.body.errors.error.status.should.be.eql(401);
                done();
            });
        });

        it('it should GET a 200 http code as a result and a user because we set the correct token', (done) => {
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");

            user.save((err, user) => {
                let token = user.generateJWT();
                chai.request(app)
                .get('/api/users/current')
                .set("Authorization", "Token " + token)
                .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property("user");
                        res.body.user.should.have.property("firstname");
                        res.body.user.firstname.should.be.eql("p");
                        res.body.user.should.have.property("name");
                        res.body.user.name.should.be.eql("r");
                        res.body.user.should.have.property("email");
                        res.body.user.email.should.be.eql("r@gmail.com");
                        res.body.user.should.have.property("token");
                    done();
                });
            });
        });
    });

    describe('/POST createUser', () => {
        it('it should POST a user because all the fields exist', (done) => {
            let user = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com",
                password: "test"
            };
        chai.request(app)
            .post('/api/users')
            .send({user:user})
            .end((err, res) => {
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
                done();
            });
        });
        
        it('it should not POST a new user when name field is missing', (done) => {
            let user = {
                firstname: "paul",
                password: "test",
                email: "paul.t@mail.com"
            };
        chai.request(app)
            .post('/api/users')
            .send({user:user})
            .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.be.a('object');
                    res.body.should.have.property('errors');
                    res.body.errors.should.have.property('name');
                    res.body.errors.name.should.be.eql('isrequired');
                done();
            });
        });

        it('it should not POST a new user when firstname field is missing', (done) => {
            let user = {
                name: "t",
                password: "test",
                email: "paul.t@mail.com"
            };
        chai.request(app)
            .post('/api/users')
            .send({user:user})
            .end((err, res) => {
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('errors');
                res.body.errors.should.have.property('firstname');
                res.body.errors.firstname.should.be.eql('isrequired');
                done();
            });
        });

        it('it should not POST a new user when password field is missing', (done) => {
            let user = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };
        chai.request(app)
            .post('/api/users')
            .send({user:user})
            .end((err, res) => {
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('errors');
                res.body.errors.should.have.property('password');
                res.body.errors.password.should.be.eql('isrequired');
                done();
            });
        });

        it('it should not POST a new user when email field is missing', (done) => {
            let user = {
                name: "t",
                firstname: "paul",
                password: "test",
            };
        chai.request(app)
            .post('/api/users')
            .send({user:user})
            .end((err, res) => {
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('errors');
                res.body.errors.should.have.property('email');
                res.body.errors.email.should.be.eql('isrequired');
                done();
            });
        });

        it('it should not POST a new user when an email is duplicated', (done) => {
            let jsonUser = { name: "t", firstname: "paul", email: "paul.t@mail.com" };
            let user = new Users(jsonUser);
            user.setPassword("test");

            user.save((err, user) => {
                jsonUser.password = "test";

                chai.request(app)
                .post('/api/users')
                .send({user:jsonUser})
                .end((err, res) => {
                    res.should.have.status(422);
                    res.body.should.be.a('object');
                    res.body.should.have.property('errors');
                    res.body.errors.should.have.property('email');
                    res.body.errors.email.should.be.eql('alreadyexisting');
                    done();
                });
            });
        });
    });

    describe('/POST login', () => {
        it('it should login because the password is correct', (done) => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");

            user.save((err, user) => {
                chai.request(app)
                .post('/api/users/login')
                .send({user:{ email:"paul.t@mail.com", password:"test"}})
                .end((err, res) => {
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
                    done();
                });
            });
            
        });

        it('it should not login because the password is incorrect', (done) => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");

            user.save((err, user) => {
                chai.request(app)
                .post('/api/users/login')
                .send({user:{ email:"paul.t@mail.com", password:"t"}})
                .end((err, res) => {
                        res.should.have.status(400);
                        res.body.should.be.a('object');
                        res.body.should.have.property('errors');
                        res.body.errors.should.have.property('password');
                        res.body.errors.password.should.be.eql('invalid');
                    done();
                });
            });
        });

        it('it should not login because the email is unknown', (done) => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");

            user.save((err, user) => {
                chai.request(app)
                .post('/api/users/login')
                .send({user:{ email:"p.t@mail.com", password:"t"}})
                .end((err, res) => {
                        res.should.have.status(400);
                        res.body.should.be.a('object');
                        res.body.should.have.property('errors');
                        res.body.errors.should.have.property('email');
                        res.body.errors.email.should.be.eql('invalid');
                    done();
                });
            });
        });

        it('it should not login because the email is missing', (done) => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");

            user.save((err, user) => {
                chai.request(app)
                .post('/api/users/login')
                .send({user:{ password:"t"}})
                .end((err, res) => {
                        res.should.have.status(422);
                        res.body.should.be.a('object');
                        res.body.should.have.property('errors');
                        res.body.errors.should.have.property('email');
                        res.body.errors.email.should.be.eql('isrequired');
                    done();
                });
            });
        });

        it('it should not login because the password is missing', (done) => {
            let jsonuser = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };

            let user = new Users(jsonuser);
            user.setPassword("test");

            user.save((err, user) => {
                chai.request(app)
                .post('/api/users/login')
                .send({user:{ email:"paul.t@mail.com" }})
                .end((err, res) => {
                        res.should.have.status(422);
                        res.body.should.be.a('object');
                        res.body.should.have.property('errors');
                        res.body.errors.should.have.property('password');
                        res.body.errors.password.should.be.eql('isrequired');
                    done();
                });
            });
        });
    });
});