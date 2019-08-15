const { tokenDec } = require('../utils/auth');

exports.authorize = () => async (ctx, next) => {
  const authorization = ctx.headers.authorization || '';
  if (!authorization) ctx.throw(401, 'unauthorization');
  ctx.authInfo = await tokenDec(authorization);
  await next();
};

exports.authorizeIONext = () => async (socket, next) => {
  const { handshake } = socket;
  const ctx = {
    headers: {
      authorization: handshake.query && handshake.query.token,
    },
    authInfo: '',
    throw: (code, err) => {
      throw new Error(err);
    },
  };
  try {
    await exports.authorize()(ctx, next);
    handshake.authInfo = ctx.authInfo;
  } catch (error) {
    // console.log(typeof error);
    next(error);
  }
  // next(new Error('unauthoraz'));
};
