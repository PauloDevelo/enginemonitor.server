import { IUser } from "../models/Users";
import config, { isProd, isTest } from "./configUtils";
import logger from "./logger";
import nodemailer from "nodemailer";

export type UsageAlertContext = {
  MaxNumberDaysWithoutUsage: number;
  NumberOfDayBeforeDeletion: number;
  User: IUser;
}

type MailData = {
  to: string,
  subject: string,
  text: string,
  html: string
};

const from = 'my.equipment.maintenance@gmail.com';

function sendMsg(msg: MailData) {
  if (isTest === false) {
    const debugMsg = "Sending a message " + JSON.stringify(msg);
    logger.debug(debugMsg);
  }

  if (isProd === true) {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: from,
        pass: config.get('gmailAppPassword')
      }
    });
    
    var mailOptions = {
      from,
      ...msg
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        logger.error(error);
      } else {
        logger.debug(`Email sent: ${info.response}`);
      }
    });
  }
}

export const sendVerificationEmail = (to: string, token: string) => {
  const hostUrl = config.get("hostURL");

  const msg: MailData = { 
    to,
    subject: "Verify Your Email",
    text: `Click on this link to verify your email ${hostUrl}users/verification?token=${token}&email=${to} `,
    html: `Click on this <a href="${hostUrl}users/verification?token=${token}&email=${to}">link</a> to verify your email`
  }

  return sendMsg(msg);
};

export const sendChangePasswordEmail = (to: string, token: string) => {
  const hostUrl = config.get("hostURL");

  const msg: MailData = {
    to,
    subject: "Confirm change of password",
    text: `Click on this link to confirm the change of password ${hostUrl}users/changepassword?token=${token} `,
    // tslint:disable-next-line:max-line-length
    html: `Click on this <a href=" ${hostUrl}users/changepassword?token=${token}">link</a> to confirm the change of password. If you are not at the origin of this change, please ignore this email.`
  }

  return sendMsg(msg);
};

export const sendUsageAlertBeforeAccountDeletion = (context: UsageAlertContext) => {
  const user = context.User;
  const frontEndUrl = config.get("frontEndUrl");

  const msg: MailData = {
    to: user.email,
    subject: "[Equipment Maintenance] Your account is going to be deleted",
    text:
  `Hi ${user.firstname},
  You didn't use Equipment maintenance web application for almost ${context.MaxNumberDaysWithoutUsage} days.
  Consequently, we will remove all your data (equipments, tasks, entries and images) from our system if you don't log in to ${frontEndUrl} before ${context.NumberOfDayBeforeDeletion} days.
  Hope to see you soon,
  The Equipment maintenance team
  `,
    // tslint:disable-next-line:max-line-length
    html: `<p>Hi ${user.firstname},</p>
  <div>
  <div>You didn't use <a href="${frontEndUrl}">Equipment maintenance web application</a> for almost ${context.MaxNumberDaysWithoutUsage} days.</div>
  <div>&nbsp;</div>
  <div>Consequently, we will remove all your data (equipments, tasks, entries and images) from our system if you don't <a href="${frontEndUrl}">log in</a> before ${context.NumberOfDayBeforeDeletion} days.</div>
  <div>&nbsp;</div>
  <div>Hope to see you soon,</div>
  <div>&nbsp;</div>
  <div style="text-align: left;">The Equipment maintenance team</div>
  </div>`
  }

  return sendMsg(msg);
};

const sendEmailHelper = { sendVerificationEmail, sendChangePasswordEmail, sendUsageAlertBeforeAccountDeletion };
export default sendEmailHelper;
