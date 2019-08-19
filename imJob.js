const fs = require('fs');
const EventEmitter = require('events');
const uuidv4 = require('uuid/v4');

const dumpFile = './im.data';

const cushionTime = 1000; // ms
const poolMaxSize = 1000;

class IMJob extends EventEmitter {
  constructor() {
    super();
    this.timer = '';
    this.onLine = {};
    this.onLineCount = 0;
    this.failMessages = [];
    this.messageQueue = [];
    this.messagePool = {
      time: Date.now(),
      messages: [],
    };
  }

  start() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = setTimeout(() => {
      this.checkMessagePoll();
      while (this.messageQueue.length > 0) {
        this.consumeQueue();
      }
      this.start();
    }, cushionTime);
  }

  addSocket(socket) {
    const { info } = socket.handshake.authInfo;
    const { openID } = info;
    const oldSocket = this.onLine[openID];
    if (oldSocket) {
      oldSocket.disconnect(true);
    } else {
      this.onLine[openID] = socket;
      this.onLineCount += 1;
    }
  }

  removeSocket(socket) {
    const { info: { openID } } = socket.handshake.authInfo;
    this.onLine[openID] = '';
    this.onLineCount -= 1;
  }

  addMessage(message, from) {
    const id = uuidv4();
    const serverTime = Date.now();
    const { to } = message;
    const msg = {
      id,
      serverTime,
      from,
      ...message,
    };
    const existItem = this.messagePool.messages.find((item) => item.to === to);
    if (existItem) {
      existItem.data.push(msg);
    } else {
      this.messagePool.messages.push({
        to,
        data: [msg],
      });
    }
  }

  consumeQueue() {
    const poolItem = this.messageQueue.shift();
    const { messages } = poolItem;
    this.dispatchMessage(messages);
  }

  dispatchMessage(messages) {
    const { failMessages } = this;
    this.failMessages = [];
    [...failMessages, ...messages].forEach((message) => {
      const { to, data } = message;
      // console.log(message);
      const onLineSocket = this.onLine[to];
      if (onLineSocket) onLineSocket.emit('message', data);
      else this.failMessages.push(message);
    });
  }

  checkMessagePoll() {
    const nowTime = Date.now();
    if (
      (nowTime - this.messagePool.time) >= cushionTime
      || (this.messagePool.messages.length > poolMaxSize)
    ) {
      this.messageQueue.push(this.messagePool);
      this.messagePool = {
        time: nowTime,
        messages: [],
      };
    }
  }

  dump() {
    const dumpData = {
      failMessages: this.failMessages,
      messageQueue: this.messageQueue,
      messagePool: this.messagePool,
    };
    fs.writeFileSync(dumpFile, JSON.stringify(dumpData));
    // eslint-disable-next-line no-console
    console.log('data dump success');
  }

  loadDump() {
    if (!fs.existsSync(dumpFile)) {
      fs.openSync(dumpFile, 'w');
    }
    const data = fs.readFileSync(dumpFile, { encoding: 'utf8' });
    try {
      const dumpData = JSON.parse(data);
      if (dumpData.failMessages) {
        this.failMessages = [...dumpData.failMessages, ...this.failMessages];
      }
      if (dumpData.messageQueue) {
        this.messageQueue = [...dumpData.messageQueue, ...this.messageQueue];
      }
      if (dumpData.messagePool) {
        this.messagePool = {
          time: this.messagePool.time,
          messages: [...dumpData.messagePool.messages, ...this.messagePool.messages],
        };
      }
    // eslint-disable-next-line no-empty
    } catch (error) {}
  }
}

const imJob = new IMJob();
imJob.loadDump();
imJob.start();

// imJob.on('message', imJob.addMessage)
// imJob.on('socket-join', imJob.addSocket)

module.exports = imJob;
