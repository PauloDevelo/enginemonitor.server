import { MailData } from "@sendgrid/helpers/classes/mail";
import sgMail from "@sendgrid/mail";
import config, { isProd, isTest } from "./configUtils";
import logger from "./logger";

const from = "no-reply@ecogium.fr";

function sendMsg(msg: MailData) {
  if(isTest === false){
    const debugMsg = "Sending a message " + JSON.stringify(msg);
    logger.debug(debugMsg);
  }

  if (isProd === true) {
    sgMail.setApiKey(config.get("SENDGRID_API_KEY"));
    return sgMail.send(msg);
  }
};

export const sendVerificationEmail = (to: string, token: string) => {
  const hostUrl = config.get("hostURL");

  const msg: MailData = { from };
  msg.to = to;
  msg.subject = "Verify Your Email";
  msg.text = `Click on this link to verify your email ${hostUrl}users/verification?token=${token}&email=${to} `;
  // tslint:disable-next-line:max-line-length
  msg.html = `Click on this <a href="${hostUrl}users/verification?token=${token}&email=${to}">link</a> to verify your email`;

  return sendMsg(msg);
};

export const sendChangePasswordEmail = (to: string, token: string) => {
    const hostUrl = config.get("hostURL");

    const msg: MailData = { from };
    msg.to = to;
    msg.subject = "Confirm change of password";
    msg.text = `Click on this link to confirm the change of password ${hostUrl}users/changepassword?token=${token} `;
    // tslint:disable-next-line:max-line-length
    msg.html = `Click on this <a href=" ${hostUrl}users/changepassword?token=${token}">link</a> to confirm the change of password. If you are not at the origin of this change, please ignore this email.`;

    return sendMsg(msg);
  };

const sendGridEmailHelper = { sendVerificationEmail, sendChangePasswordEmail };
export default sendGridEmailHelper;
