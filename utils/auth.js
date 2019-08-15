const util = require('util');

const jwt = require('jsonwebtoken');
const config = require('config');

const APP_SECRET = config.get('APP_SECRET');

const jwtSign = util.promisify(jwt.sign);
const jwtVerify = util.promisify(jwt.verify);

exports.tokenGen = async ({ userInfo, role = 0 }) => { // role 0 游客，1 注册用户
  const tokenStr = await jwtSign({ role, ...userInfo }, APP_SECRET);
  return tokenStr;
};

exports.tokenDec = async (token) => {
  const tokenInfo = await jwtVerify(token, APP_SECRET);
  // tokenInfo._id = mongoose.Types.ObjectId(tokenInfo._id);
  return tokenInfo;
};
