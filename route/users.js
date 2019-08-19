const Router = require('koa-router');
const uuidv4 = require('uuid/v4');

const { authorize } = require('../middleware');
const { tokenGen } = require('../utils/auth');

const VISITOR_AUTH = 0;
// const AUTH = 1;

const router = new Router({
  prefix: '/users',
});

router.post('/loginasvisitor', async (ctx) => {
  const auth = 0;
  const openID = Buffer.from(uuidv4()).toString('base64');
  const info = {
    openID,
    nickname: '游客',
    avator: '',
  };
  const token = await tokenGen({ role: auth, userInfo: info });
  ctx.body = {
    info,
    token,
    auth: VISITOR_AUTH,
  };
});

router.use(async (ctx, next) => {
  // console.log(ctx.path);
  await next();
}).use(authorize());

router.get('/auth', async (ctx) => {
  const { authInfo } = ctx;
  ctx.body = {
    info: {
      ...authInfo,
    },
    auth: authInfo.role,
  };
});

router.get('/chats', async (ctx) => {
  // const { authInfo } = ctx;
  ctx.body = {
    chats: [
      {
        id: '12345678912',
        type: '',
        name: '广场',
        chatMsg: [],
      },
    ],
  };
});

module.exports = router;
