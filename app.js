const http = require('http');
const Koa = require('koa');
// const Router = require('koa-router');
// const bodyParser = require('koa-bodyparser');
const logger = require('koa-logger');
const socketIO = require('socket.io');

const imJob = require('./imJob');
const router = require('./route');
const { authorizeIONext } = require('./middleware');

const app = new Koa();

const server = http.createServer(app.callback());
const io = socketIO(server);

const PORT = 9877;

app.use(logger()).use(async (ctx, next) => {
  // ctx.body = {
  //   hello: 'world',
  // };
  await next();
}).use(router.routes()).use(router.allowedMethods());

io.use(authorizeIONext()).on('connection', (socket) => {
  imJob.addSocket(socket);
  socket.on('message', (message) => {
    const from = socket.handshake.authInfo.info;
    // console.log(from);
    imJob.addMessage(message, from);
  });
  socket.on('disconnect', () => {
    imJob.removeSocket(socket);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is starting on port ${PORT}`);
});

process.on('SIGINT', async () => {
  // co(function* Gracefull() { // Gracefull restart/reload/stop
  // await adService.tick(true); // save status to db
  // console.error('Graceful shutdown');
  await imJob.dump();
  // console.log('sigint', r);
  setTimeout(() => {
    process.exit(0);
  }, 500);
});
