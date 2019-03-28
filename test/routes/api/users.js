//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const app = require('../../../src/app');
const config = require('../../../src/utils/configUtils');
const sendGridEmailHelper = require('../../../src/utils/sendGridEmailHelper');

const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const should = chai.should();
const sinon = require('sinon');

const Users = mongoose.model('Users');
const NewPasswords = mongoose.model('NewPasswords');


chai.use(chaiHttp);

describe('Users', () => {
    afterEach(async () => {
        await Users.deleteMany();
        await NewPasswords.deleteMany();
        sinon.restore();        
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
            // Arrange
            let user = { name: "t", firstname: "paul", email: "paul.t@mail.com", password: "test" };
            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            // Act
            let res = await chai.request(app).post('/api/users').send({ user:user });

            // Assert
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.not.have.property('user');
            expect(sendGridEmailHelper.sendVerificationEmail.calledOnceWith("paul.t@mail.com")).to.be.true;
        });
        
        it('it should not POST a new user when name field is missing', async () => {
            // Arrange
            let user = {
                firstname: "paul",
                password: "test",
                email: "paul.t@mail.com"
            };
            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');
            
            // Act
            let res = await chai.request(app).post('/api/users').send({user:user});
            
            // Assert
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('name');
            res.body.errors.name.should.be.eql('isrequired');
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
        });

        it('it should not POST a new user when firstname field is missing', async () => {
            let user = {
                name: "t",
                password: "test",
                email: "paul.t@mail.com"
            };
            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            let res = await chai.request(app).post('/api/users').send({user:user});
            
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('firstname');
            res.body.errors.firstname.should.be.eql('isrequired');
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
        });

        it('it should not POST a new user when password field is missing', async () => {
            let user = {
                name: "t",
                firstname: "paul",
                email: "paul.t@mail.com"
            };
            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            let res = await chai.request(app).post('/api/users').send({user:user})
            
            res.should.have.status(422);
            res.body.should.be.a('object');
            res.body.should.have.property('errors');
            res.body.errors.should.have.property('password');
            res.body.errors.password.should.be.eql('isrequired');
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
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

    describe('/POST verificationemail', () => {
        it('Should called the function sendVerificationEmail because the user asked it', async() =>{
            // Arrange
            const jsonUser = { name: "r", firstname: "p", email: "r@gmail.com" };
            let user = new Users(jsonUser);
            user.setPassword("test");
            user = await user.save();

            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            // Act
            let res = await chai.request(app).post('/api/users/verificationemail').send({ user:jsonUser });

            // Assert
            res.should.have.status(200);
            expect(sendGridEmailHelper.sendVerificationEmail.calledOnceWith(jsonUser.email)).to.be.true;
        });

        it('Should not called the function sendVerificationEmail because the user asked to resend the verification link for an email that does not exist', async() =>{
            // Arrange
            const jsonUser = { name: "r", firstname: "p", email: "r@gmail.com" };

            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            // Act
            let res = await chai.request(app).post('/api/users/verificationemail').send({ user:jsonUser });

            // Assert
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("email");
            res.body.errors.email.should.be.eql("isinvalid");
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
        });

        it('Should not called the function sendVerificationEmail because the user asked to resend the verification link for an email that does not exist', async() =>{
            // Arrange
            const jsonUser = { name: "r", firstname: "p", email: "r@gmail.com" };

            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            // Act
            let res = await chai.request(app).post('/api/users/verificationemail').send({ user:jsonUser });

            // Assert
            res.should.have.status(400);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("email");
            res.body.errors.email.should.be.eql("isinvalid");
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
        });

        it('Should not called the function sendVerificationEmail because the user asked to resend the verification link but some the user is not sent', async() =>{
            // Arrange
            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            // Act
            let res = await chai.request(app).post('/api/users/verificationemail').send({ });

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("email");
            res.body.errors.email.should.be.eql("isrequired");
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
        });

        it('Should not called the function sendVerificationEmail because the user asked to resend the verification link but the email is undefined', async() =>{
            // Arrange
            const jsonUser = { name: "r" };
            sinon.spy(sendGridEmailHelper, 'sendVerificationEmail');

            // Act
            let res = await chai.request(app).post('/api/users/verificationemail').send({ user: jsonUser });

            // Assert
            res.should.have.status(422);
            res.body.should.have.property("errors");
            res.body.errors.should.have.property("email");
            res.body.errors.email.should.be.eql("isrequired");
            expect(sendGridEmailHelper.sendVerificationEmail.called).to.be.false;
        });

    });

    describe('/POST resetPassword', () => {
        it('should send an email to confirm the change of password', async() => {
            // Arrange
            const jsonReset = { email: "pt@g.com", newPassword: "test" };

            let user = new Users({ name: "r", firstname: "p", email: jsonReset.email });
            user.setPassword("t");
            user = await user.save();

            sinon.spy(sendGridEmailHelper, 'sendChangePasswordEmail');

            // Act
            let res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

            // Assert
            const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: jsonReset.email });
            res.should.have.status(200);
            nbNewPasswordDoc.should.be.eq(1);
            expect(sendGridEmailHelper.sendChangePasswordEmail.calledOnceWith(jsonReset.email)).to.be.true;
        });

        it('should not send an email to confirm the change of password because the email passed does not exist', async() => {
            // Arrange
            const jsonReset = { email: "pt@g.com", newPassword: "test" };

            let user = new Users({ name: "r", firstname: "p", email: "pto@g.com" });
            user.setPassword("t");
            user = await user.save();

            sinon.spy(sendGridEmailHelper, 'sendChangePasswordEmail');

            // Act
            let res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

            // Assert
            const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: jsonReset.email });
            nbNewPasswordDoc.should.be.eq(0);

            res.should.have.status(400);
            res.body.errors.email.should.be.eq('isinvalid');
            expect(sendGridEmailHelper.sendChangePasswordEmail.called).to.be.false;
        });

        it('should not send an email to confirm the change of password because there is no email passed', async() => {
            // Arrange
            const jsonReset = { newPassword: "test" };

            let user = new Users({ name: "r", firstname: "p", email: "pto@g.com" });
            user.setPassword("t");
            user = await user.save();

            sinon.spy(sendGridEmailHelper, 'sendChangePasswordEmail');

            // Act
            let res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

            // Assert
            const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: jsonReset.email });
            nbNewPasswordDoc.should.be.eq(0);

            res.should.have.status(422);
            res.body.errors.email.should.be.eq('isrequired');
            expect(sendGridEmailHelper.sendChangePasswordEmail.called).to.be.false;
        });

        it('should not send an email to confirm the change of password because there is no email passed', async() => {
            // Arrange
            const jsonReset = { email: "test" };

            let user = new Users({ name: "r", firstname: "p", email: "pto@g.com" });
            user.setPassword("t");
            user = await user.save();

            sinon.spy(sendGridEmailHelper, 'sendChangePasswordEmail');

            // Act
            let res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

            // Assert
            const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: jsonReset.email });
            nbNewPasswordDoc.should.be.eq(0);

            res.should.have.status(422);
            res.body.errors.password.should.be.eq('isrequired');
            expect(sendGridEmailHelper.sendChangePasswordEmail.called).to.be.false;
        });
    });

    describe('/GET Check email', () => {
        it('should change the flag isVerified', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.initUser();
            user.setPassword("test");
            user = await user.save();

            // Act
            let res = await chai.request(app).get('/api/users/verification').query({email: user.email, token: user.verificationToken});

            // Assert
            res.status.should.be.eq(200);
            expect(res).to.redirectTo(config.frontEndUrl);
            user = await Users.findById(user._id);
            user.isVerified.should.be.true;
        });

        it('should send an error code 422 the email is not passed', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.initUser();
            user.setPassword("test");
            user = await user.save();

            // Act
            let res = await chai.request(app).get('/api/users/verification').query({token: user.verificationToken});

            // Assert
            res.status.should.be.eq(422);
            res.body.errors.email.should.be.eql('isrequired')
            user = await Users.findById(user._id);
            user.isVerified.should.be.false;
        });

        it('should send an error code 422 the token is not passed', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.initUser();
            user.setPassword("test");
            user = await user.save();

            // Act
            let res = await chai.request(app).get('/api/users/verification').query({email: user.email});

            // Assert
            res.status.should.be.eq(422);
            res.body.errors.token.should.be.eql('isrequired')
            user = await Users.findById(user._id);
            user.isVerified.should.be.false;
        });

        it('should change the flag isVerified', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.initUser();
            user.setPassword("test");
            user = await user.save();

            // Act
            let res = await chai.request(app).get('/api/users/verification').query({email: "tr@gmail.com", token: user.verificationToken});

            // Assert
            res.status.should.be.eq(400);
            res.body.errors.email.should.be.eql('isinvalid');

            user = await Users.findById(user._id);
            user.isVerified.should.be.false;
        });

        it('should change the flag isVerified', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.initUser();
            user.setPassword("test");
            user = await user.save();

            // Act
            let res = await chai.request(app).get('/api/users/verification').query({email: user.email, token: "sdffsdfgsdofhhnogn"});

            // Assert
            res.status.should.be.eq(400);
            res.body.errors.token.should.be.eql('isinvalid');

            user = await Users.findById(user._id);
            user.isVerified.should.be.false;
        });
    });

    describe('/GET changePassword', () => {
        it('should change the password', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let newPassword = new NewPasswords();
            newPassword.initNewPassword(user.email, 'newpassword');
            newPassword = await newPassword.save();

            // Act
            let res = await chai.request(app).get('/api/users/changepassword').query({token: newPassword.verificationToken});

            // Assert
            res.status.should.be.eq(200);
            expect(res).to.redirectTo(config.frontEndUrl);
            user = await Users.findById(user._id);
            user.validatePassword('newpassword').should.be.true;

            const nbNewPassword = await NewPasswords.countDocuments({email: user.email});
            nbNewPassword.should.be.eq(0);
        });

        it('should not change the password and return a error 422 because the token is missing in the query', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let newPassword = new NewPasswords();
            newPassword.initNewPassword(user.email, 'newpassword');
            newPassword = await newPassword.save();

            // Act
            let res = await chai.request(app).get('/api/users/changepassword');

            // Assert
            res.status.should.be.eq(422);
            res.body.errors.token.should.be.eql('isrequired');
            
            user = await Users.findById(user._id);
            user.validatePassword('test').should.be.true;

            const nbNewPassword = await NewPasswords.countDocuments({email: user.email});
            nbNewPassword.should.be.eq(1);
        });

        it('should not change the password and return a error 400 because the token is invalid', async() => {
            // Arrange
            let user = new Users({ name: "r", firstname: "p", email: "r@gmail.com" });
            user.setPassword("test");
            user = await user.save();

            let newPassword = new NewPasswords();
            newPassword.initNewPassword(user.email, 'newpassword');
            newPassword = await newPassword.save();

            // Act
            let res = await chai.request(app).get('/api/users/changepassword').query({token: 'fjbslvbeevbqurrv'});;

            // Assert
            res.status.should.be.eq(400);
            res.body.errors.token.should.be.eql('isinvalid');
            
            user = await Users.findById(user._id);
            user.validatePassword('test').should.be.true;

            const nbNewPassword = await NewPasswords.countDocuments({email: user.email});
            nbNewPassword.should.be.eq(1);
        });
    });
});