let config = require('./configUtils');

const from = 'no-reply@ecogium.fr';

const sendMsg = (msg) => {
  console.log(msg);
  if(config.isProd === true){
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.SENDGRID_API_KEY);

    return sgMail.send(msg);
  }
}

const createMsg = ()=>{return { from: from }; }

const sendVerificationEmail = (to, token) => {
    const hostUrl = config.hostURL;
    
    const msg = createMsg();
    msg.to = to;
    msg.subject = 'Verify Your Email';
    msg.text = `Click on this link to verify your email ${hostUrl}users/verification?token=${token}&email=${to} `;
    msg.html = `Click on this <a href="${hostUrl}users/verification?token=${token}&email=${to}">link</a> to verify your email`;

    return sendMsg(msg);
  };

  const sendChangePasswordEmail = (to, token) => {
    const hostUrl = config.hostURL;

    const msg = createMsg();
    msg.to = to;
    msg.subject = 'Confirm change of password';
    msg.text = `Click on this link to confirm the change of password ${hostUrl}users/changepassword?token=${token} `;
    msg.html = `Click on this <a href=" ${hostUrl}users/changepassword?token=${token}">link</a> to confirm the change of password. If you are not at the origin of this change, please ignore this email.`;

    return sendMsg(msg);
  }

  module.exports = { sendVerificationEmail, sendChangePasswordEmail };