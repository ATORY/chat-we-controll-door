const http = require('http');
const Koa = require('koa');
// const Router = require('koa-router');
// const bodyParser = require('koa-bodyparser');
const socketIO = require('socket.io');

const imJob = require('./imJob');

const app = new Koa();

const server = http.createServer(app.callback());
const io = socketIO(server);

const PORT = 9877;

app.use(async (ctx) => {
  ctx.body = 'Hello World';
});

io.use((socket, next) => {
  if (socket.handshake.query && socket.handshake.query.phone) {
    next();
    // if (socket.handshake.query && socket.handshake.query.token){
    //   jwt.verify(socket.handshake.query.token, 'SECRET_KEY', function(err, decoded) {
    //     if(err) return next(new Error('Authentication error'));
    //     socket.decoded = decoded;
    //     next();
    //   });
  } else {
    next(new Error('Authentication error'));
  }
}).on('connection', (socket) => {
  imJob.addSocket(socket);
  socket.on('message', imJob.addMessage.bind(imJob));
  socket.on('disconnect', () => {
    imJob.removeSocket(socket);
  });
}).on('error', (err) => {
  // eslint-disable-next-line no-console
  console.log(err);
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
