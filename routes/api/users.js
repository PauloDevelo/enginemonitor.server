let config = require('config');
const mongoose = require('mongoose');
const passport = require('passport');
const { sendVerificationEmail, sendChangePasswordEmail } = require('../../utils/sendGridEmailHelper');

const Users = mongoose.model('Users');
const NewPasswords = mongoose.model('NewPasswords');
const { saveModel } = require('../../utils/mogoUtils')

//POST new user route (optional, everyone has access)
async function createUser(req, res){
  try{
    const { body: { user } } = req;

    if(!user.email) {
      return res.status(422).json({ errors: { email: 'isrequired' } });
    }

    if(!user.password) {
      return res.status(422).json({ errors: { password: 'isrequired' } });
    }

    if(!user.name) {
      return res.status(422).json({ errors: { name: 'isrequired' } });
    }

    if(!user.firstname) {
      return res.status(422).json({ errors: { firstname: 'isrequired' } });
    }

    let number = await Users.countDocuments({ email: user.email });
    if(number > 0){
      return res.status(422).json({ errors: { email: 'alreadyexisting' } });
    }

    let finalUser = new Users(user);
    finalUser.initUser();
    finalUser.setPassword(user.password);
    finalUser = await saveModel(finalUser);

    await sendVerificationEmail(finalUser.email, finalUser.verificationToken);

    res.json({ user: finalUser.toAuthJSON() });
  }
  catch(error){
    res.send(error);
  }
}

//GET Verify the user's email
async function checkEmail(req, res){
  try{
    const { query: { email, token } } = req;

    const user = await Users.find({ email: email });

    if(!user[0]){
      return res.status(400).json({ errors: { email: 'isinvalid' } });
    }

    if(user[0].verificationToken !== token){
      return res.status(400).json({ errors: { token: 'isinvalid' } });
    }

    user[0].isVerified = true;

    await saveModel(user[0]);

    res.redirect(config.frontEndUrl);
  }
  catch(error){
    res.send(err);
  }
}

// GET Change the user's password after clicking on the confirmation email
async function changePassword(req, res){
  try{
    const { query: { token } } = req;

    const newPassword = await NewPasswords.find({ verificationToken: token });

    if(!newPassword[0]){
      return res.status(400).json({ errors: { token: 'isinvalid' } });
    }

    const user = await Users.find({ email: newPassword[0].email });
    if(!user[0]){
      return res.status(400).json({ errors: { email: 'isinvalid' } });
    }

    user[0].isVerified = true;
    user[0].salt = newPassword[0].salt;
    user[0].hash = newPassword[0].hash;

    await saveModel(user[0]);
    await newPassword[0].delete();

    res.redirect(config.frontEndUrl);
  }
  catch(error){
    res.send(err);
  }
}

// POST create a new password and send an email to confirm the change of password
async function resetPassword(req, res){
  try{
    const { body: { email, newPassword } } = req;

    const user = await Users.find({ email: email });
  
    if(!user[0]){
      return res.status(400).json({ errors: { email: 'isinvalid' } });
    }
  
    if(!email) {
      return res.status(422).json({ errors: { email: 'isrequired' } });
    }
  
    if(!newPassword) {
      return res.status(422).json({ errors: { password: 'isrequired' } });
    }
  
    let newPasswords = new NewPasswords();
    newPasswords.initNewPassword(email, newPassword);
    newPasswords = await saveModel(newPasswords);
  
    await sendChangePasswordEmail(newPasswords.email, newPasswords.verificationToken);

    return res.status(200).json({});
  }
  catch(error){
    res.send(error);
  }
}

//POST send another verification email
async function verificationEmail(req, res, next){
  try{
    const { body: { user } } = req;

    if(!user.email) {
      return res.status(422).json({ errors: { email: 'isrequired' } });
    }

    const usersInDb = await Users.find({email: user.email});
    if(!usersInDb[0]){
      return res.status(400).json({ errors: { email: 'isinvalid' } });
    }

    let userInDb = usersInDb[0];
    if(!userInDb.isVerified){
      userInDb.initUser();
      userInDb = await saveModel(userInDb);

      await sendVerificationEmail(userInDb.email, userInDb.verificationToken);
    }

    return res.status(200).json({});
  }
  catch(error){
    res.send(error);
  }
} 

//POST login route (optional, everyone has access)
function login(req, res, next){
  const { body: { user } } = req;

  if(!user.email) {
    return res.status(422).json({ errors: { email: 'isrequired' } });
  }

  if(!user.password) {
    return res.status(422).json({ errors: { password: 'isrequired' } });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
    if(err) {
      return next(err);
    }

    if(passportUser) {
      return res.json({ user: passportUser.toAuthJSON() });
    }

    return res.status(400).json(info);
  })(req, res, next);
}

//GET current route (required, only authenticated users have access)
async function getCurrent(req, res){
  const { payload: { id } } = req;

  let user = await Users.findById(id)
  if(!user) {
    return res.status(400).json({ errors: { id: 'isinvalid' } });
  }

  return res.json({ user: user.toAuthJSON() });
}

module.exports = { login, getCurrent, createUser, checkEmail, resetPassword, changePassword, verificationEmail };