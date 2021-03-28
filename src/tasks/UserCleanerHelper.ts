/* eslint-disable no-underscore-dangle */
import moment from 'moment';
import AssetUser from '../models/AssetUser';
import GuestLinks from '../models/GuestLinks';
import Users from '../models/Users';
import logger from '../utils/logger';
import sendEmailHelper, { IUsageAlertContext } from '../utils/sendEmailHelper';

const maxNumberOfDayWithoutUsingTheWebApp = 366;

export async function sendEmailToUsersWhoAreGoingToBeDeleted(nbDayBeforeDeletion: number): Promise<void> {
  logger.info(`sendEmailToUsersWhoAreGoingToBeDeleted(${nbDayBeforeDeletion})`);
  const dateRangeMin = moment()
    .startOf('day')
    .subtract(maxNumberOfDayWithoutUsingTheWebApp - nbDayBeforeDeletion, 'day');

  const query = { name: { $ne: 'Guest' } };
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

  const query = { name: { $ne: 'Guest' } };
  let users = await Users.find(query);

  users = users.filter((user) => {
    const lastAuth = moment(user.lastAuth);
    return lastAuth.isBefore(dateRangeMax);
  });

  const deletionPromises = users.map((user) => user.deleteOne());
  await Promise.all(deletionPromises);
}

export async function deleteOrphanGuestUser(): Promise<void> {
  logger.info('deleteOrphanGuestUser');

  const guests = await Users.find({ name: 'Guest' });

  const deletionPromises = guests.map(async (guest) => {
    if (await AssetUser.countDocuments({ userId: guest._id }) === 0) {
      await GuestLinks.deleteMany({ guestUserId: guest._id });
      await guest.deleteOne();
    }
  });
  await Promise.all(deletionPromises);
}
