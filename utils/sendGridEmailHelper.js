let config = require('config');

const sendVerificationEmail = (to, token) => {
    const hostUrl = config.hostURL;
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(config.SENDGRID_API_KEY);

    const msg = {
        to: to,
        from: 'no-reply@ecogium.fr',
        subject: 'Verify Your Email',
        text: `Click on this link to verify your email ${hostUrl}users/verification?token=${token}&email=${to}`,
        html: `Click on this <a href="${hostUrl}users/verification?token=${token}&email=${to}">link</a> to verify your email`,
    };

    return sgMail.send(msg);
  };

  module.exports = { sendVerificationEmail };