const mongoose = require('mongoose');
const passport = require('passport');

const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
async function createUser(req, res){
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

  let query = { email: user.email };
  let number = await Users.countDocuments(query);
  if(number > 0){
    return res.status(422).json({ errors: { email: 'alreadyexisting' } });
  }

  const finalUser = new Users(user);
  finalUser.setPassword(user.password);

  return finalUser.save((err, user) => {
    if(err) res.send(err);
    res.json({ user: user.toAuthJSON() });
  });
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

module.exports = { login, getCurrent, createUser };