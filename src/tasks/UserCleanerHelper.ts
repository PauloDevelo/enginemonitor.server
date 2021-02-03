/* eslint-disable no-underscore-dangle */
import moment from 'moment';
import AssetUser from '../models/AssetUser';
import GuestLinks from '../models/GuestLinks';
import Users, { deleteUserModel } from '../models/Users';
import logger from '../utils/logger';
import sendEmailHelper, { IUsageAlertContext } from '../utils/sendEmailHelper';

const maxNumberOfDayWithoutUsingTheWebApp = 365;

export async function sendEmailToUsersWhoAreGoingToBeDeleted(nbDayBeforeDeletion: number): Promise<void> {
  logger.info(`sendEmailToUsersWhoAreGoingToBeDeleted(${nbDayBeforeDeletion})`);
  const dateRangeMin = moment()
    .startOf('day')
    .subtract(maxNumberOfDayWithoutUsingTheWebApp - nbDayBeforeDeletion, 'day');

  const query = { forbidSelfDelete: false };
  let users = await Users.find(query);

  users = users.filter((user) => {
    const lastAuth = moment(user.lastAuth).startOf('day');
    return lastAuth.isSame(dateRangeMin);
  });

  users.forEach((user) => {
    const context: IUsageAlertContext = {
      MaxNumberDaysWithoutUsage: maxNumberOfDayWithoutUsingTheWebApp,
      NumberOfDayBeforeDeletion: nbDayBeforeDeletion,
      User: user,
    };

    sendEmailHelper.sendUsageAlertBeforeAccountDeletion(context);
  });
}

export async function deleteUserWhoDidNotUseTheWebApp(): Promise<void> {
  logger.info('deleteUserWhoDidNotUseTheWebApp');

  const dateRangeMax = moment()
    .endOf('day')
    .subtract(maxNumberOfDayWithoutUsingTheWebApp, 'day');

  const query = { forbidSelfDelete: false };
  let users = await Users.find(query);

  users = users.filter((user) => {
    const lastAuth = moment(user.lastAuth);
    return lastAuth.isBefore(dateRangeMax);
  });

  const deletionPromises = users.map((user) => deleteUserModel(user));
  await Promise.all(deletionPromises);
}

export async function deleteOrphanGuestUser(): Promise<void> {
  logger.info('deleteOrphanGuestUser');

  const guestQuery = { name: 'Guest' };
  const guests = await Users.find(guestQuery);

  const deletionPromises = guests.map(async (guest) => {
    const assetUserQuery = { userId: guest._id };
    const assetUserLinks = await AssetUser.find(assetUserQuery);

    if (assetUserLinks.length === 0) {
      const queryGuestLink = { guestUserId: guest._id };
      const guestLinks = await GuestLinks.find(queryGuestLink);

      await Promise.all(guestLinks.map((guestLink) => guestLink.remove()));

      await deleteUserModel(guest);
    }
  });
  await Promise.all(deletionPromises);
}
