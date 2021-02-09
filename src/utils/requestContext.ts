import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import Users, { IUser } from '../models/Users';

const namespaceName = 'requestcontext';

const ns: Namespace = createNamespace(namespaceName);

const getRequestContext = (): Namespace => {
  const session = getNamespace(namespaceName);

  if (!session) {
    throw new Error('CLS namespace required');
  }

  return session;
};

export const getUser = (): IUser => {
  const session = getRequestContext();
  return session.get('user');
};

const setUser = (user: IUser) => {
  const session = getRequestContext();
  session.set('user', user);
};

const setUserContext = async (req: any) => {
  if (!req
          || !req.body
          || !req.body.payload
          || !req.body.payload.id
          || !req.body.payload.verificationToken) {
    setUser(undefined);
    return;
  }

  const { id } = req.body.payload;
  const { verificationToken } = req.body.payload;

  try {
    const user = await Users.findById(id);
    if (!user) {
      setUser(undefined);
      return;
    }

    if (user.verificationToken !== verificationToken) {
      setUser(undefined);
      return;
    }

    setUser(user);
  } catch (error) {
    setUser(undefined);
  }
};

// eslint-disable-next-line no-unused-vars
export const requestContextBinder = (): (req, res, next) => void => {
  if (!ns) { throw new Error('CLS namespace required'); }

  return function requestContextMiddleware(req, res, next) {
    ns.bindEmitter(req);
    ns.bindEmitter(res);

    ns.run(async () => {
      await setUserContext(req);
      next();
    });
  };
};

export default getUser;
