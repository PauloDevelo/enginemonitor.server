import passport from "../../models/passport";
import config from "../../utils/configUtils";
import sendGridHelper from "../../utils/sendGridEmailHelper";

import NewPasswords, { INewPasswords } from "../../models/NewPasswords";
import Users from "../../models/Users";
import { asyncForEach } from "../../utils/asyncUtils";

// POST new user route (optional, everyone has access)
async function createUser(req: any, res: any) {
  try {
    const { body: { user } } = req;

    if (!user.email) {
      return res.status(422).json({ errors: { email: "isrequired" } });
    }

    if (!user.password) {
      return res.status(422).json({ errors: { password: "isrequired" } });
    }

    if (!user.name) {
      return res.status(422).json({ errors: { name: "isrequired" } });
    }

    if (!user.firstname) {
      return res.status(422).json({ errors: { firstname: "isrequired" } });
    }

    const usertCount = await Users.countDocuments({ email: user.email });
    if (usertCount > 0) {
      return res.status(422).json({ errors: { email: "alreadyexisting" } });
    }

    let finalUser = new Users(user);
    finalUser.initUser();
    finalUser.setPassword(user.password);
    finalUser = await finalUser.save();

    await sendGridHelper.sendVerificationEmail(finalUser.email, finalUser.verificationToken);

    res.status(200).json({ });
  } catch (error) {
    res.send(error);
  }
}

// GET Verify the user's email
async function checkEmail(req: any, res: any) {
  try {
    const { query: { email , token } } = req;

    if (!email) {
      return res.status(422).json({ errors: { email: "isrequired" } });
    }

    if (!token) {
      return res.status(422).json({ errors: { token: "isrequired" } });
    }

    const user = await Users.find({ email });

    if (!user[0]) {
      return res.status(400).json({ errors: { email: "isinvalid" } });
    }

    if (user[0].verificationToken !== token) {
      return res.status(400).json({ errors: { token: "isinvalid" } });
    }

    user[0].isVerified = true;

    await user[0].save();

    res.redirect(config.get("frontEndUrl"));
  } catch (error) {
    res.send(error);
  }
}

// GET Change the user's password after clicking on the confirmation email
async function changePassword(req: any, res: any) {
  try {
    const { query: { token } } = req;

    if (!token) {
      return res.status(422).json({ errors: { token: "isrequired" } });
    }

    const newPassword = await NewPasswords.find({ verificationToken: token });
    if (!newPassword[0]) {
      return res.status(400).json({ errors: { token: "isinvalid" } });
    }

    const user = await Users.find({ email: newPassword[0].email });
    if (!user[0]) {
      return res.status(400).json({ errors: { email: "isinvalid" } });
    }

    user[0].isVerified = true;
    user[0].salt = newPassword[0].salt;
    user[0].hash = newPassword[0].hash;

    await user[0].save();
    await newPassword[0].remove();

    res.redirect(config.get("frontEndUrl"));
  } catch (error) {
    res.send(error);
  }
}

// POST create a new password and send an email to confirm the change of password
async function resetPassword(req: any, res: any) {
  try {
    const { body: { email, newPassword } } = req;

    if (!email) {
      return res.status(422).json({ errors: { email: "isrequired" } });
    }

    if (!newPassword) {
      return res.status(422).json({ errors: { password: "isrequired" } });
    }

    const user = await Users.find({ email });

    if (!user[0]) {
      return res.status(400).json({ errors: { email: "isinvalid" } });
    }

    const currentNewPasswords = await NewPasswords.find({ email });

    await asyncForEach(currentNewPasswords, async (password: INewPasswords) => {
      await password.remove();
    });

    let newPasswords = new NewPasswords();
    newPasswords.initNewPassword(email, newPassword);
    newPasswords = await newPasswords.save();

    await sendGridHelper.sendChangePasswordEmail(newPasswords.email, newPasswords.verificationToken);

    return res.status(200).json({});
  } catch (error) {
    res.send(error);
  }
}

// POST send another verification email
async function verificationEmail(req: any, res: any) {
  try {
    const { body: { user } } = req;

    if (!user || !user.email) {
      return res.status(422).json({ errors: { email: "isrequired" } });
    }

    const usersInDb = await Users.find({email: user.email});
    if (!usersInDb[0]) {
      return res.status(400).json({ errors: { email: "isinvalid" } });
    }

    let userInDb = usersInDb[0];
    if (!userInDb.isVerified) {
      userInDb.initUser();
      userInDb = await userInDb.save();

      await sendGridHelper.sendVerificationEmail(userInDb.email, userInDb.verificationToken);
    }

    return res.status(200).json({});
  } catch (error) {
    res.send(error);
  }
}

// POST login route (optional, everyone has access)
function login(req: any, res: any, next: any) {
  const { body: { user } } = req;

  if (!user.email) {
    return res.status(422).json({ errors: { email: "isrequired" } });
  }

  if (!user.password) {
    return res.status(422).json({ errors: { password: "isrequired" } });
  }

  return passport.authenticate("local", { session: false }, (err, passportUser, info) => {
    if (err) {
      return next(err);
    }

    if (passportUser) {
      return res.json({ user: passportUser.toAuthJSON() });
    }

    return res.status(400).json(info);
  })(req, res, next);
}

// GET current route (required, only authenticated users have access)
async function getCurrent(req: any, res: any) {
  const { payload: { id } } = req;

  const user = await Users.findById(id);
  if (!user) {
    return res.status(400).json({ errors: { id: "isinvalid" } });
  }

  return res.json({ user: user.toAuthJSON() });
}

export default { login, getCurrent, createUser, checkEmail, resetPassword, changePassword, verificationEmail };
