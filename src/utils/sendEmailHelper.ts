import nodemailer from 'nodemailer';
import { IAssets } from '../models/Assets';
import { IUser } from '../models/Users';
import config, { isProd, isTest } from './configUtils';
import logger from './logger';

export interface IUsageAlertContext {
  MaxNumberDaysWithoutUsage: number;
  NumberOfDayBeforeDeletion: number;
  User: IUser;
}

export interface IRegistrationInvitation{
  newOwnerEmail: string,
  previousOwner: IUser,
  asset: IAssets
}

interface IMailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const from = 'my.equipment.maintenance@gmail.com';

function sendMsg(msg: IMailData) {
  if (isTest === false) {
    const debugMsg = `Sending a message ${JSON.stringify(msg)}`;
    logger.debug(debugMsg);
  }

  if (isProd === true) {
    const transporter = nodemailer.createTransport({
      auth: {
        pass: config.get('gmailAppPassword'),
        user: from,
      },
      service: 'gmail',
    });

    const mailOptions = {
      from,
      ...msg,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logger.error(error);
      } else {
        logger.debug(`Email sent: ${info.response}`);
      }
    });
  }
}

export const sendVerificationEmail = (to: string, token: string) => {
  const hostUrl = config.get('hostURL');

  const msg: IMailData = {
    html: `Click on this <a href="${hostUrl}users/verification?token=${token}&email=${to}">link</a> to verify your email`,
    subject: 'Verify Your Email',
    text: `Click on this link to verify your email ${hostUrl}users/verification?token=${token}&email=${to} `,
    to,
  };

  return sendMsg(msg);
};

export const sendChangePasswordEmail = (to: string, token: string) => {
  const hostUrl = config.get('hostURL');

  const msg: IMailData = {
    html: `Click on this <a href=" ${hostUrl}users/changepassword?token=${token}">link</a> to confirm the change of password. If you are not at the origin of this change, please ignore this email.`,
    subject: 'Confirm change of password',
    text: `Click on this link to confirm the change of password ${hostUrl}users/changepassword?token=${token} `,
    to,
  };

  return sendMsg(msg);
};

export const sendUsageAlertBeforeAccountDeletion = (context: IUsageAlertContext) => {
  const user = context.User;
  const frontEndUrl = config.get('frontEndUrl');

  const msg: IMailData = {
    html: `<p>Hi ${user.firstname},</p>
          <div>
          <div>You didn't use <a href="${frontEndUrl}">Equipment maintenance web application</a> for almost ${context.MaxNumberDaysWithoutUsage} days.</div>
          <div>&nbsp;</div>
          <div>Consequently, we will remove all your data (equipments, tasks, entries and images) from our system if you don't <a href="${frontEndUrl}">log in</a> before ${context.NumberOfDayBeforeDeletion} days.</div>
          <div>&nbsp;</div>
          <div>Hope to see you soon,</div>
          <div>&nbsp;</div>
          <div style="text-align: left;">The Equipment maintenance team</div>
          </div>`,
    subject: '[Equipment Maintenance] Your account is going to be deleted',
    text:
  `Hi ${user.firstname},
  You didn't use Equipment maintenance web application for almost ${context.MaxNumberDaysWithoutUsage} days.
  Consequently, we will remove all your data (equipments, tasks, entries and images) from our system if you don't log in to ${frontEndUrl} before ${context.NumberOfDayBeforeDeletion} days.
  Hope to see you soon,
  The Equipment maintenance team`,
    to: user.email,

  };

  return sendMsg(msg);
};

export const sendRegistrationInvitation = (context: IRegistrationInvitation) => {
  const frontEndUrl = config.get('frontEndUrl');

  const msg: IMailData = {
    html: `<p>Hi,</p>
          <div>
          <div>You are invited by ${context.previousOwner.firstname} ${context.previousOwner.name} to register to <a href="${frontEndUrl}">Equipment maintenance</a>, a web application which helps owners to maintain their assets.</div>
          <div>&nbsp;</div>
          <div>${context.previousOwner.firstname} used <a href="${frontEndUrl}">Equipment maintenance</a> to track ${context.asset.name}'s maintenance and (s)he gave you the ownership.</div>
          <div>&nbsp;</div>
          <div>To proceed, you have to register to <a href="${frontEndUrl}">Equipment maintenance</a>, then you will become automatically the new owner of ${context.asset.name}.</div>
          <div>&nbsp;</div>
          <div>Hope to see you soon,</div>
          <div>&nbsp;</div>
          <div style="text-align: left;">The Equipment maintenance team</div>
          </div>`,
    subject: `[Equipment Maintenance] Invitation to take the ownership of ${context.asset.name}`,
    text:
`Hi,

You are invited by ${context.previousOwner.firstname} ${context.previousOwner.name} to register to Equipment maintenance, a web application which helps owners to maintain their assets.
${context.previousOwner.firstname} used Equipment maintenance</a> to track ${context.asset.name}'s maintenance and (s)he gave you the ownership.

To proceed, you have to register to ${frontEndUrl}, then you will become automatically the new owner of ${context.asset.name}.

Hope to see you soon,
The Equipment maintenance team`,
    to: context.newOwnerEmail,
  };

  return sendMsg(msg);
};

// eslint-disable-next-line max-len
const sendEmailHelper = {
  sendVerificationEmail, sendChangePasswordEmail, sendUsageAlertBeforeAccountDeletion, sendRegistrationInvitation,
};
export default sendEmailHelper;
