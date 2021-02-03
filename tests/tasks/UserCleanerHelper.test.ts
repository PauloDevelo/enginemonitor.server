/* eslint-disable no-unused-expressions */
/* eslint-disable import/first */
/* eslint-disable no-unused-vars */
// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

import sinon from 'sinon';
import chai from 'chai';

import moment from 'moment';
import ignoredErrorMessages, { restoreLogger, mockLogger } from '../MockLogger';

import server from '../../src/server';

import Users from '../../src/models/Users';
import AssetUser, { createUserAssetLink } from '../../src/models/AssetUser';
import Assets from '../../src/models/Assets';

import sendEmailHelper, { IUsageAlertContext } from '../../src/utils/sendEmailHelper';
import { deleteOrphanGuestUser, deleteUserWhoDidNotUseTheWebApp, sendEmailToUsersWhoAreGoingToBeDeleted } from '../../src/tasks/UserCleanerHelper';

const { expect } = chai;
const should = chai.should();

const { app } = server;

describe('UserCleanerHelper', () => {
  before(() => {
    mockLogger();
    ignoredErrorMessages.push('Sending a message');
    ignoredErrorMessages.push('sendEmailToUsersWhoAreGoingToBeDeleted');
  });

  after(() => {
    restoreLogger();
  });

  afterEach(async () => {
    await Users.deleteMany({});
    await Assets.deleteOne({});
    await AssetUser.deleteOne({});
    sinon.restore();
  });

  describe('sendEmailToUsersWhoAreGoingToBeDeleted', () => {
    let sendUsageAlertBeforeAccountDeletionSpy: sinon.SinonSpy;
    beforeEach(() => {
      sendUsageAlertBeforeAccountDeletionSpy = sinon.spy(sendEmailHelper, 'sendUsageAlertBeforeAccountDeletion');
    });

    afterEach(() => {
      sendUsageAlertBeforeAccountDeletionSpy.restore();
    });

    it('should send no email since there is no user in the database', async () => {
      // Arrange
      // Act
      await sendEmailToUsersWhoAreGoingToBeDeleted(10);

      // Assert
      sendUsageAlertBeforeAccountDeletionSpy.notCalled.should.be.equal(true);
    });

    const dataRows = [
      {
        lastAuthInDays: 365 - 12, nbDayBeforeDeletion: 12, forbidSelfDelete: false, expectAnEmail: true,
      },
      {
        lastAuthInDays: 365 - 12, nbDayBeforeDeletion: 12, forbidSelfDelete: true, expectAnEmail: false,
      },
      {
        lastAuthInDays: 365 - 13, nbDayBeforeDeletion: 12, forbidSelfDelete: false, expectAnEmail: false,
      },
      {
        lastAuthInDays: 365 - 11, nbDayBeforeDeletion: 12, forbidSelfDelete: false, expectAnEmail: false,
      },
    ];

    dataRows.forEach((dataRow) => {
      it('should send an email to one user', async () => {
        // Arrange
        let user = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
        user.setPassword('test');
        user.lastAuth = moment().subtract(dataRow.lastAuthInDays, 'day').toDate();
        user.forbidSelfDelete = dataRow.forbidSelfDelete;
        user = await user.save();

        // Act
        await sendEmailToUsersWhoAreGoingToBeDeleted(dataRow.nbDayBeforeDeletion);

        // Assert
        const isCorrectUser = sinon.match((usageAlertContext: IUsageAlertContext) => usageAlertContext.User._id.equals(user._id));

        expect(sendUsageAlertBeforeAccountDeletionSpy.withArgs(
          sinon.match.hasOwn('MaxNumberDaysWithoutUsage', 365),
        ).withArgs(
          sinon.match.hasOwn('NumberOfDayBeforeDeletion', dataRow.nbDayBeforeDeletion),
        ).withArgs(
          sinon.match(isCorrectUser),
        ).calledOnce).to.be.eql(dataRow.expectAnEmail);

        expect(sendUsageAlertBeforeAccountDeletionSpy.calledOnce).to.be.eql(dataRow.expectAnEmail);
      });
    });

    const dataFor2UsersRows = [
      {
        lastAuthInDaysUser1: 365 - 11, expectAnEmailForUser1: false, lastAuthInDaysUser2: 365 - 12, expectAnEmailForUser2: true, nbDayBeforeDeletion: 12,
      },
      {
        lastAuthInDaysUser1: 365 - 12, expectAnEmailForUser1: true, lastAuthInDaysUser2: 365 - 12, expectAnEmailForUser2: true, nbDayBeforeDeletion: 12,
      },
      {
        lastAuthInDaysUser1: 365 - 13, expectAnEmailForUser1: false, lastAuthInDaysUser2: 365 - 13, expectAnEmailForUser2: false, nbDayBeforeDeletion: 12,
      },
    ];

    dataFor2UsersRows.forEach((dataFor2UsersRow) => {
      it('should send an email to one or two users', async () => {
        // Arrange
        let user1 = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
        user1.setPassword('test');
        user1.lastAuth = moment().subtract(dataFor2UsersRow.lastAuthInDaysUser1, 'day').toDate();
        user1.forbidSelfDelete = false;
        user1 = await user1.save();

        let user2 = new Users({ name: 'r', firstname: 'g', email: 'g@gmail.com' });
        user2.setPassword('test');
        user2.lastAuth = moment().subtract(dataFor2UsersRow.lastAuthInDaysUser2, 'day').toDate();
        user2.forbidSelfDelete = false;
        user2 = await user2.save();

        let user3 = new Users({ name: 'r', firstname: 'h', email: 'h@gmail.com' });
        user3.setPassword('test');
        user3.lastAuth = moment().subtract(600, 'day').toDate();
        user3.forbidSelfDelete = true;
        user3 = await user3.save();

        // Act
        await sendEmailToUsersWhoAreGoingToBeDeleted(dataFor2UsersRow.nbDayBeforeDeletion);

        // Assert
        const isUser1 = sinon.match((usageAlertContext: IUsageAlertContext) => usageAlertContext.User._id.equals(user1._id));
        expect(sendUsageAlertBeforeAccountDeletionSpy.withArgs(
          sinon.match.hasOwn('MaxNumberDaysWithoutUsage', 365),
        ).withArgs(
          sinon.match.hasOwn('NumberOfDayBeforeDeletion', dataFor2UsersRow.nbDayBeforeDeletion),
        ).withArgs(
          sinon.match(isUser1),
        ).calledOnce).to.be.eql(dataFor2UsersRow.expectAnEmailForUser1);

        const isUser2 = sinon.match((usageAlertContext: IUsageAlertContext) => usageAlertContext.User._id.equals(user2._id));
        expect(sendUsageAlertBeforeAccountDeletionSpy.withArgs(
          sinon.match.hasOwn('MaxNumberDaysWithoutUsage', 365),
        ).withArgs(
          sinon.match.hasOwn('NumberOfDayBeforeDeletion', dataFor2UsersRow.nbDayBeforeDeletion),
        ).withArgs(
          sinon.match(isUser2),
        ).calledOnce).to.be.eql(dataFor2UsersRow.expectAnEmailForUser2);

        expect(sendUsageAlertBeforeAccountDeletionSpy.callCount).to.be.eql((dataFor2UsersRow.expectAnEmailForUser1 ? 1 : 0) + (dataFor2UsersRow.expectAnEmailForUser2 ? 1 : 0));
      });
    });
  });

  describe('deleteOrphanGuestUser', () => {
    it('should remove the orphan guest from the database', async () => {
      // Arrange
      let guest = new Users({ name: 'Guest', firstname: 'Guest', email: 'guest@guestland.com' });
      guest.setPassword('guest');
      guest.lastAuth = moment().subtract(600, 'day').toDate();
      guest.forbidSelfDelete = true;
      guest = await guest.save();

      let arbutus = new Assets({
        _uiId: 'sailboat_01', brand: 'Aluminum & Technics', manufactureDate: new Date('1979-01-01T00:00:00.000Z'), modelBrand: 'Heliotrope', name: 'Arbutus',
      });
      arbutus = await arbutus.save();

      let guestToNotRemove = new Users({ name: 'Guest', firstname: 'Guest', email: 'guest@guestland.com' });
      guestToNotRemove.setPassword('guest');
      guestToNotRemove.lastAuth = moment().subtract(600, 'day').toDate();
      guestToNotRemove.forbidSelfDelete = true;
      guestToNotRemove = await guestToNotRemove.save();

      await createUserAssetLink({ user: guestToNotRemove, asset: arbutus, readonly: true });

      // Act
      await deleteOrphanGuestUser();

      // Assert
      const nbUserInDataBase = await Users.countDocuments();
      nbUserInDataBase.should.be.eql(1);

      const remainingUser = await Users.findById(guestToNotRemove._id);
      remainingUser.equals(guestToNotRemove).should.be.eql(true);
    });
  });

  describe('deleteUserWhoDidNotUseTheWebApp', () => {
    it('should remove only the users who did not use the app for more than 365 days and who are selfDeletable', async () => {
      // Arrange
      let userToDelete = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      userToDelete.setPassword('test');
      userToDelete.lastAuth = moment().subtract(366, 'day').toDate();
      userToDelete.forbidSelfDelete = false;
      userToDelete = await userToDelete.save();

      let userToNotDelete = new Users({ name: 'r', firstname: 'p', email: 'r@gmail.com' });
      userToNotDelete.setPassword('test');
      userToNotDelete.lastAuth = moment().subtract(364, 'day').toDate();
      userToNotDelete.forbidSelfDelete = false;
      userToNotDelete = await userToNotDelete.save();

      let guest = new Users({ name: 'Guest', firstname: 'Guest', email: 'guest@guestland.com' });
      guest.setPassword('test');
      guest.lastAuth = moment().subtract(600, 'day').toDate();
      guest.forbidSelfDelete = true;
      guest = await guest.save();

      // Act
      await deleteUserWhoDidNotUseTheWebApp();

      // Assert
      const nbUserRemaining = await Users.countDocuments();
      nbUserRemaining.should.eql(2);

      const guestInDb = await Users.findById(guest._id);
      guestInDb.equals(guest).should.be.true;

      const userInDb = await Users.findById(userToNotDelete._id);
      userInDb.equals(userToNotDelete).should.be.true;
    });
  });
});
