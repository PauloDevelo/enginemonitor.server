/* eslint-disable no-unused-expressions */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';
import chai from 'chai';
import chaiHttp from 'chai-http';
import fs from 'fs';
import sinon from 'sinon';

import server from '../../src/server';

import sendEmailHelper from '../../src/utils/sendEmailHelper';

import config from '../../src/utils/configUtils';

import Users from '../../src/models/Users';
import NewPasswords from '../../src/models/NewPasswords';

import ignoredErrorMessages, { restoreLogger, mockLogger } from '../MockLogger';
import Assets from '../../src/models/Assets';
import AssetUser from '../../src/models/AssetUser';
import Equipments from '../../src/models/Equipments';
import Images from '../../src/models/Images';
import Tasks from '../../src/models/Tasks';
import Entries from '../../src/models/Entries';
import PendingRegistrations from '../../src/models/PendingRegistrations';

chai.use(chaiHttp);
const { expect } = chai;
const should = chai.should();

const { app } = server;

describe('Users', () => {
  before(() => {
    mockLogger();
    ignoredErrorMessages.push('Sending a message');
    ignoredErrorMessages.push('invalid signature');
    ignoredErrorMessages.push('No authorization token was found');
  });

  after(() => {
    restoreLogger();
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Assets.deleteMany({});
    await AssetUser.deleteMany({});
    await Equipments.deleteMany({});
    await Tasks.deleteMany({});
    await Entries.deleteMany({});
    await NewPasswords.deleteMany({});
    await Images.deleteMany({});
    sinon.restore();
  });

  describe('/GET current user', () => {
    it('it should GET a 401 http code as a result because the request does not have the token', async () => {
      const res = await chai.request(app).get('/api/users/current');

      res.status.should.be.eql(401);
      res.body.errors.message.should.be.eql('No authorization token was found');
      res.body.errors.error.name.should.be.eql('UnauthorizedError');
      res.body.errors.error.code.should.be.eql('credentials_required');
      res.body.errors.error.status.should.be.eql(401);
    });

    it('it should GET a 422 http error code as a result because the verification token is not in the authentification token', async () => {
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user.verificationToken = undefined;
      await user.save();

      const res = await chai.request(app).get('/api/users/current').set('Authorization', `Token ${user.generateJWT()}`);

      res.should.have.status(422);
      res.body.errors.authentication.should.be.eql('error');
    });

    it('it should GET a 400 http error code as a result because the verification token is not correct in the authentification token', async () => {
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      const oldJWT = user.generateJWT();

      user.setPassword('hello');
      await user.save();

      const res = await chai.request(app).get('/api/users/current').set('Authorization', `Token ${oldJWT}`);

      res.should.have.status(400);
      res.body.errors.authentication.should.be.eql('error');
    });

    it('it should GET a 200 http code as a result and a user because we set the correct token', async () => {
      const user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      await user.save();

      const res = await chai.request(app).get('/api/users/current').set('Authorization', `Token ${user.generateJWT()}`);

      res.should.have.status(200);
      res.body.should.have.property('user');
      res.body.user.should.have.property('firstname');
      res.body.user.firstname.should.be.eql('p');
      res.body.user.should.have.property('name');
      res.body.user.name.should.be.eql('r');
      res.body.user.should.have.property('email');
      res.body.user.email.should.be.eql('r@gmail.com');
      res.body.user.should.have.property('token');
    });
  });

  describe('/POST createUser', () => {
    it('it should POST a user because all the fields exist', async () => {
      // Arrange
      const jsonUser = {
        name: 't', firstname: 'paul', email: 'paul.t@mail.com', password: 'test', _uiId: 'dasddninwfb',
      };
      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users').send({ user: jsonUser });

      // Assert
      const user = await Users.findOne({ email: jsonUser.email });
      expect(user !== null).to.be.true;

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.not.have.property('user');
      expect(sendVerificationEmailSpy.calledOnce).to.be.true;
      expect(sendVerificationEmailSpy.withArgs('paul.t@mail.com', user.verificationToken).calledOnce).to.be.true;
      sendVerificationEmailSpy.restore();
    });

    it('it should not POST a new user when name field is missing', async () => {
      // Arrange
      const user = {
        firstname: 'paul',
        password: 'test',
        email: 'paul.t@mail.com',
      };
      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users').send({ user });

      // Assert
      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('name');
      res.body.errors.name.should.be.eql('isrequired');
      expect(sendVerificationEmailSpy.called).to.be.false;
      sendVerificationEmailSpy.restore();
    });

    it('it should not POST a new user when firstname field is missing', async () => {
      const user = {
        name: 't',
        password: 'test',
        email: 'paul.t@mail.com',
      };
      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      const res = await chai.request(app).post('/api/users').send({ user });

      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('firstname');
      res.body.errors.firstname.should.be.eql('isrequired');
      expect(sendVerificationEmailSpy.called).to.be.false;
      sendVerificationEmailSpy.restore();
    });

    it('it should not POST a new user when password field is missing', async () => {
      const user = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
      };
      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      const res = await chai.request(app).post('/api/users').send({ user });

      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('password');
      res.body.errors.password.should.be.eql('isrequired');
      expect(sendVerificationEmailSpy.called).to.be.false;
      sendVerificationEmailSpy.restore();
    });

    it('it should not POST a new user when email field is missing', async () => {
      const user = {
        name: 't',
        firstname: 'paul',
        password: 'test',
      };

      const res = await chai.request(app).post('/api/users').send({ user });

      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('isrequired');
    });

    it('it should not POST a new user when an email is duplicated', async () => {
      // Arrange
      const jsonUser = {
        name: 't', firstname: 'paul', email: 'paul.t@mail.com', _uiId: 'äsdvassdvasdvbo',
      };
      const user = new Users(jsonUser);
      user.setPassword('test');
      await user.save();

      const jsonUserToSend = {
        name: 't', firstname: 'paul', email: 'paul.t@mail.com', password: 'test', _uiId: 'dfggnen',
      };

      // Act
      const res = await chai.request(app).post('/api/users').send({ user: jsonUserToSend });

      // Assert
      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('alreadyexisting');
    });
  });

  describe('/POST login', () => {
    it('it should login because the password is correct and the email is verified', async () => {
      const jsonUser = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
        isVerified: true,
      };

      const user = new Users(jsonUser);
      user.setPassword('test');
      user.isVerified = true;
      await user.save();

      const res = await chai.request(app).post('/api/users/login').send({ user: { email: 'paul.t@mail.com', password: 'test' } });

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
      const jsonUser = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
        isVerified: false,
      };

      const user = new Users(jsonUser);
      user.setPassword('test');
      await user.save();

      const res = await chai.request(app).post('/api/users/login').send({ user: { email: 'paul.t@mail.com', password: 'test' } });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('needVerification');
    });

    it('it should not login because the password is incorrect', async () => {
      const jsonUser = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
      };

      const user = new Users(jsonUser);
      user.setPassword('test');
      user.isVerified = true;
      await user.save();

      const res = await chai.request(app).post('/api/users/login').send({ user: { email: 'paul.t@mail.com', password: 't' } });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('password');
      res.body.errors.password.should.be.eql('invalid');
    });

    it('it should not login because the email is unknown', async () => {
      const jsonUser = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
      };

      const user = new Users(jsonUser);
      user.setPassword('test');
      await user.save();

      const res = await chai.request(app).post('/api/users/login').send({ user: { email: 'p.t@mail.com', password: 't' } });

      res.should.have.status(400);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('invalid');
    });

    it('it should not login because the email is missing', async () => {
      const jsonUser = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
      };

      const user = new Users(jsonUser);
      user.setPassword('test');
      await user.save();

      const res = await chai.request(app).post('/api/users/login').send({ user: { password: 't' } });

      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('isrequired');
    });

    it('it should not login because the password is missing', async () => {
      const jsonUser = {
        name: 't',
        firstname: 'paul',
        email: 'paul.t@mail.com',
      };

      const user = new Users(jsonUser);
      user.setPassword('test');
      await user.save();

      const res = await chai.request(app).post('/api/users/login').send({ user: { email: 'paul.t@mail.com' } });

      res.should.have.status(422);
      res.body.should.be.a('object');
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('password');
      res.body.errors.password.should.be.eql('isrequired');
    });
  });

  describe('/POST verificationemail', () => {
    it('Should called the function sendVerificationEmail because the user asked it', async () => {
      // Arrange
      const jsonUser = {
        name: 'r', firstname: 'p', email: 'r@gmail.com', verificationToken: 'my special token',
      };
      const user = new Users(jsonUser);
      user.setPassword('test');
      await user.save();

      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users/verificationemail').send({ email: jsonUser.email });

      // Assert
      const newUser = await Users.findOne({ email: 'r@gmail.com' });
      expect(newUser).to.not.be.null;
      expect(newUser.verificationToken).to.not.be.eql(jsonUser.verificationToken);

      res.should.have.status(200);
      expect(sendVerificationEmailSpy.calledOnceWith(jsonUser.email, newUser.verificationToken)).to.be.true;
      sendVerificationEmailSpy.restore();
    });

    it('Should not called the function sendVerificationEmail because the user asked to resend the verification link for an email that does not exist', async () => {
      // Arrange
      const jsonUser = { name: 'r', firstname: 'p', email: 'r@gmail.com' };

      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users/verificationemail').send({ email: jsonUser.email });

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('isinvalid');
      expect(sendVerificationEmailSpy.called).to.be.false;
      sendVerificationEmailSpy.restore();
    });

    it('Should not called the function sendVerificationEmail because the user asked to resend the verification link for an email that does not exist', async () => {
      // Arrange
      const jsonUser = { name: 'r', firstname: 'p', email: 'r@gmail.com' };

      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users/verificationemail').send({ email: jsonUser.email });

      // Assert
      res.should.have.status(400);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('isinvalid');
      expect(sendVerificationEmailSpy.called).to.be.false;
      sendVerificationEmailSpy.restore();
    });

    it('Should not called the function sendVerificationEmail because the user asked to resend the verification link but some the user is not sent', async () => {
      // Arrange
      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users/verificationemail').send({ });

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('isrequired');
      expect(sendVerificationEmailSpy.called).to.be.false;
      sendVerificationEmailSpy.restore();
    });

    it('Should not called the function sendVerificationEmail because the user asked to resend the verification link but the email is undefined', async () => {
      // Arrange
      const jsonUser = { name: 'r' };
      const sendVerificationEmailSpy = sinon.spy(sendEmailHelper, 'sendVerificationEmail');

      // Act
      const res = await chai.request(app).post('/api/users/verificationemail').send({ email: undefined });

      // Assert
      res.should.have.status(422);
      res.body.should.have.property('errors');
      res.body.errors.should.have.property('email');
      res.body.errors.email.should.be.eql('isrequired');
      sendVerificationEmailSpy.called.should.be.false;
      sendVerificationEmailSpy.restore();
    });
  });

  describe('/POST resetPassword', () => {
    it('should send an email to confirm the change of password', async () => {
      // Arrange
      const jsonReset = { email: 'pt@g.com', newPassword: 'test' };

      const user = new Users({ name: 'r', firstname: 'p', email: jsonReset.email });
      user.setPassword('t');
      await user.save();

      const sendChangePasswordEmail = sinon.spy(sendEmailHelper, 'sendChangePasswordEmail');

      // Act
      const res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

      // Assert
      const newNewPasswordDoc = await NewPasswords.findOne({ email: jsonReset.email });
      newNewPasswordDoc.should.not.be.null;

      res.should.have.status(200);

      expect(sendChangePasswordEmail.calledOnceWith(jsonReset.email, newNewPasswordDoc.verificationToken)).to.be.true;
      sendChangePasswordEmail.restore();
    });

    it('should not send an email to confirm the change of password because the email passed does not exist', async () => {
      // Arrange
      const jsonReset = { email: 'pt@g.com', newPassword: 'test' };

      const user = new Users({ name: 'r', firstname: 'p', email: 'pto@g.com' });
      user.setPassword('t');
      await user.save();

      const sendChangePasswordEmail = sinon.spy(sendEmailHelper, 'sendChangePasswordEmail');

      // Act
      const res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

      // Assert
      const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: jsonReset.email });
      nbNewPasswordDoc.should.be.eq(0);

      res.should.have.status(400);
      res.body.errors.email.should.be.eq('isinvalid');
      expect(sendChangePasswordEmail.called).to.be.false;
      sendChangePasswordEmail.restore();
    });

    it('should not send an email to confirm the change of password because there is no email passed', async () => {
      // Arrange
      const jsonReset = { newPassword: 'test' };

      const user = new Users({ name: 'r', firstname: 'p', email: 'pto@g.com' });
      user.setPassword('t');
      await user.save();

      const sendChangePasswordEmail = sinon.spy(sendEmailHelper, 'sendChangePasswordEmail');

      // Act
      const res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

      // Assert
      const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: undefined });
      nbNewPasswordDoc.should.be.eq(0);

      res.should.have.status(422);
      res.body.errors.email.should.be.eq('isrequired');
      expect(sendChangePasswordEmail.called).to.be.false;
      sendChangePasswordEmail.restore();
    });

    it('should not send an email to confirm the change of password because there is no email passed', async () => {
      // Arrange
      const jsonReset = { email: 'test' };

      const user = new Users({ name: 'r', firstname: 'p', email: 'pto@g.com' });
      user.setPassword('t');
      await user.save();

      const sendChangePasswordEmail = sinon.spy(sendEmailHelper, 'sendChangePasswordEmail');

      // Act
      const res = await chai.request(app).post('/api/users/resetpassword').send(jsonReset);

      // Assert
      const nbNewPasswordDoc = await NewPasswords.countDocuments({ email: jsonReset.email });
      nbNewPasswordDoc.should.be.eq(0);

      res.should.have.status(422);
      res.body.errors.password.should.be.eq('isrequired');
      expect(sendChangePasswordEmail.called).to.be.false;
      sendChangePasswordEmail.restore();
    });
  });

  describe('/GET Check email', () => {
    it('should attached the asset linked to the pending registration and the pending registration should be removed', async () => {
      // Arrange
      let previousOwner = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      previousOwner.setPassword('test');
      previousOwner = await previousOwner.save();
      const previousOwnerJWT = `Token ${previousOwner.generateJWT()}`;

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      let assetUserLink = new AssetUser({ assetId: boat._id, userId: previousOwner._id, readonly: false });
      assetUserLink = await assetUserLink.save();

      const newOwnerEmail = 'newOwner@gmail.com';
      await chai.request(app).post(`/api/assets/changeownership/${boat._uiId}`).send({ newOwnerEmail }).set('Authorization', previousOwnerJWT);

      let newOwnerUser = new Users({ name: 'r', firstname: 'p', email: newOwnerEmail });
      newOwnerUser.setPassword('test');
      newOwnerUser = await newOwnerUser.save();

      // Act
      const res = await chai.request(app).get('/api/users/verification').query({ email: newOwnerUser.email, token: newOwnerUser.verificationToken });

      // Assert
      res.status.should.be.eq(200);
      expect(res).to.redirectTo(config.get('frontEndUrl'));
      newOwnerUser = await Users.findById(newOwnerUser._id);
      newOwnerUser.isVerified.should.be.true;

      const pendingInvitationsCounter = await PendingRegistrations.countDocuments();
      pendingInvitationsCounter.should.equal(0);

      assetUserLink = await AssetUser.findById(assetUserLink._id);
      assetUserLink.userId.equals(newOwnerUser._id).should.be.true;
    });

    it('should change the flag isVerified', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      // Act
      const res = await chai.request(app).get('/api/users/verification').query({ email: user.email, token: user.verificationToken });

      // Assert
      res.status.should.be.eq(200);
      expect(res).to.redirectTo(config.get('frontEndUrl'));
      user = await Users.findById(user._id);
      user.isVerified.should.be.true;
    });

    it('should send an error code 422 the email is not passed', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      // Act
      const res = await chai.request(app).get('/api/users/verification').query({ token: user.verificationToken });

      // Assert
      res.status.should.be.eq(422);
      res.body.errors.email.should.be.eql('isrequired');
      user = await Users.findById(user._id);
      user.isVerified.should.be.false;
    });

    it('should send an error code 422 the token is not passed', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      // Act
      const res = await chai.request(app).get('/api/users/verification').query({ email: user.email });

      // Assert
      res.status.should.be.eq(422);
      res.body.errors.token.should.be.eql('isrequired');
      user = await Users.findById(user._id);
      user.isVerified.should.be.false;
    });

    it('should change the flag isVerified', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      // Act
      const res = await chai.request(app).get('/api/users/verification').query({ email: 'tr@gmail.com', token: user.verificationToken });

      // Assert
      res.status.should.be.eq(400);
      res.body.errors.email.should.be.eql('isinvalid');

      user = await Users.findById(user._id);
      user.isVerified.should.be.false;
    });

    it('should change the flag isVerified', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      // Act
      const res = await chai.request(app).get('/api/users/verification').query({ email: user.email, token: 'sdffsdfgsdofhhnogn' });

      // Assert
      res.status.should.be.eq(400);
      res.body.errors.token.should.be.eql('isinvalid');

      user = await Users.findById(user._id);
      user.isVerified.should.be.false;
    });
  });

  describe('/GET changePassword', () => {
    it('should change the password', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      let newPassword = new NewPasswords();
      newPassword.initNewPassword(user.email, 'newpassword');
      newPassword = await newPassword.save();

      // Act
      const res = await chai.request(app).get('/api/users/changepassword').query({ token: newPassword.verificationToken });

      // Assert
      res.status.should.be.eq(200);
      expect(res).to.redirectTo(config.get('frontEndUrl'));
      user = await Users.findById(user._id);
      user.validatePassword('newpassword').should.be.true;

      const nbNewPassword = await NewPasswords.countDocuments({ email: user.email });
      nbNewPassword.should.be.eq(0);
    });

    it('should not change the password and return a error 422 because the token is missing in the query', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      let newPassword = new NewPasswords();
      newPassword.initNewPassword(user.email, 'newpassword');
      newPassword = await newPassword.save();

      // Act
      const res = await chai.request(app).get('/api/users/changepassword');

      // Assert
      res.status.should.be.eq(422);
      res.body.errors.token.should.be.eql('isrequired');

      user = await Users.findById(user._id);
      user.validatePassword('test').should.be.true;

      const nbNewPassword = await NewPasswords.countDocuments({ email: user.email });
      nbNewPassword.should.be.eq(1);
    });

    it('should not change the password and return a error 400 because the token is invalid', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();

      let newPassword = new NewPasswords();
      newPassword.initNewPassword(user.email, 'newpassword');
      newPassword = await newPassword.save();

      // Act
      const res = await chai.request(app).get('/api/users/changepassword').query({ token: 'fjbslvbeevbqurrv' });

      // Assert
      res.status.should.be.eq(400);
      res.body.errors.token.should.be.eql('isinvalid');

      user = await Users.findById(user._id);
      user.validatePassword('test').should.be.true;

      const nbNewPassword = await NewPasswords.countDocuments({ email: user.email });
      nbNewPassword.should.be.eq(1);
    });
  });

  describe('/DELETE deleteUser', () => {
    it('Should remove the asset, all the equipments, tasks, entries, and orphan entries, images and user folder', async () => {
      // Arrange
      let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      user.setPassword('test');
      user = await user.save();
      const userJWT = `Token ${user.generateJWT()}`;

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id, readonly: false });
      assetUserLink = await assetUserLink.save();

      let engine = new Equipments({
        name: 'Engine', brand: 'Nanni', model: 'N3.30', age: 1234, installation: '2018/01/20', _uiId: 'engine_01',
      });
      engine.assetId = boat._id;
      engine = await engine.save();

      const res = await chai.request(app).post(`/api/images/${engine._uiId.toString()}`)
        .field('name', 'my first image added')
        .field('_uiId', 'image_added_01')
        .field('parentUiId', engine._uiId)
        .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), `${engine._uiId}.jpeg`)
        .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), `thumbnail_${engine._uiId}.jpeg`)
        .set('Authorization', userJWT);

      // Act
      await chai.request(app).delete('/api/users').set('Authorization', userJWT);

      // Assert
      const nbUser = await Users.countDocuments();
      nbUser.should.be.eql(0);

      const nbAsset = await Assets.countDocuments();
      nbAsset.should.be.eql(0);

      const nbAssetUser = await AssetUser.countDocuments();
      nbAssetUser.should.be.eql(0);

      const nbEquipment = await Equipments.countDocuments();
      nbEquipment.should.be.eql(0);

      const nbImages = await Images.countDocuments();
      nbImages.should.be.eql(0);

      fs.existsSync(user.getUserImageFolder()).should.eql(false);
    });

    it('Should send a http error 400 because the current user cannot delete himself', async () => {
      // Arrange
      let user = new Users({
        name: 'r', firstname: 'p', email: 'r@gmail.com', forbidSelfDelete: 'true',
      });
      user.setPassword('test');
      user = await user.save();
      const userJWT = `Token ${user.generateJWT()}`;

      let boat = new Assets({
        _uiId: 'sailboat_01', brand: 'aluminium & techniques', manufactureDate: '1979/01/01', modelName: 'heliotrope', name: 'Arbutus',
      });
      boat = await boat.save();

      let assetUserLink = new AssetUser({ assetId: boat._id, userId: user._id, readonly: false });
      assetUserLink = await assetUserLink.save();

      let engine = new Equipments({
        name: 'Engine', brand: 'Nanni', model: 'N3.30', age: 1234, installation: '2018/01/20', _uiId: 'engine_01',
      });
      engine.assetId = boat._id;
      engine = await engine.save();

      const res = await chai.request(app).post(`/api/images/${engine._uiId.toString()}`)
        .field('name', 'my first image added')
        .field('_uiId', 'image_added_01')
        .field('parentUiId', engine._uiId)
        .attach('imageData', fs.readFileSync('tests/toUpload/image4.jpeg'), `${engine._uiId}.jpeg`)
        .attach('thumbnail', fs.readFileSync('tests/toUpload/thumbnail4.jpeg'), `thumbnail_${engine._uiId}.jpeg`)
        .set('Authorization', userJWT);

      // Act
      const response = await chai.request(app).delete('/api/users').set('Authorization', userJWT);

      // Assert
      response.status.should.be.eq(400);
      response.body.errors.should.be.eql('credentialError');

      const nbUser = await Users.countDocuments();
      nbUser.should.be.eql(1);

      const nbAsset = await Assets.countDocuments();
      nbAsset.should.be.eql(1);

      const nbAssetUser = await AssetUser.countDocuments();
      nbAssetUser.should.be.eql(1);

      const nbEquipment = await Equipments.countDocuments();
      nbEquipment.should.be.eql(1);

      const nbImages = await Images.countDocuments();
      nbImages.should.be.eql(1);

      fs.existsSync(user.getUserImageFolder()).should.eql(true);
    });
  });
});
