'use strict';

const stream = require('stream');

const defaultLimit = {
  items: 10
};

const defaultByteCount = item => Buffer.byteLength(item);

class BatchedTransform extends stream.Transform {

  constructor(limit = defaultLimit, byteCount = defaultByteCount) {
    super({ objectMode: true });

    this.byteLimit = limit.bytes;
    this.byteCount = byteCount;
    this.bytes = 0;

    this.itemLimit = limit.items;
    this.items = [];

    this.timeLimit = limit.time;
    this.timeout = this.startTimeout();
  }

  _transform(item, encoding, callback) {
    const byteLimit = this.byteLimit;

    if (byteLimit) {
      const bytes = this.byteCount(item);
      const newBytes = this.bytes + bytes;

      if (newBytes > byteLimit) {
        if (bytes > byteLimit) {
          if (this.listenerCount('overlimit') > 0) {
            this.emit('overlimit', item);
            callback();
          } else {
            callback(new Error(`item byte size ${bytes} over limit ${byteLimit}`));
          }
          return;
        }

        this.flushBatch();
      } else {
        this.bytes = newBytes;
      }
    }

    this.items.push(item);

    if (this.itemLimit) {
      if (this.items.length === this.itemLimit) {
        this.flushBatch();
      }
    }

    callback();
  }

  _flush(callback) {
    this.flushBatch(true);
    callback();
  }

  flushBatch(last) {
    this.cancelTimeout();

    if (this.items.length) {
      this.push(this.items);
      this.items = [];
      this.bytes = 0;
    }

    if (last) {
      return;
    }

    this.timeout = this.startTimeout();
  }

  startTimeout() {
    if (this.timeLimit) {
      return setTimeout(() => {
        this.flushBatch();
      }, this.timeLimit);
    }
  }

  cancelTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      delete this.timeout;
    }
  }

};

module.exports = function batches(options = {}) {
  return new BatchedTransform(options.limit, options.byteCount);
};
