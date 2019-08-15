const Router = require('koa-router');

const users = require('./users');

const router = new Router({
  prefix: '/api',
});

router.use(async (ctx, next) => {
  // console.log('router middle', ctx.headers);
  await next();
});

router.get('/', (ctx) => {
  ctx.body = {
    router: 'index',
  };
});

router.use(users.routes()).use(users.allowedMethods());

module.exports = router;
