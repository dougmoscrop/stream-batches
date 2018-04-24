'use strict';

const stream = require('stream');

const defaultLimit = {
  items: 10
};

const defaultByteCount = item => Buffer.byteLength(item);

class BatchedTransform extends stream.Transform {

  constructor(limit = defaultLimit, byteCount = defaultByteCount) {
    super({ objectMode: true });

    this._readableState.highWaterMark = 1;
    this._writableState.highWaterMark = 2;
    
    this.byteLimit = limit.bytes;
    this.byteCount = byteCount;
    this.bytes = 0;

    this.itemLimit = limit.items;
    this.items = [];

    this.timeLimit = limit.time;

    this.on('drain', () => {
      if (this.timedout) {
        this.flushBatch();
      }
      this.backpressure = false;
    });
  }

  _transform(item, encoding, callback) {
    let batch;

    const byteLimit = this.byteLimit;

    if (byteLimit) {
      const bytes = this.byteCount(item);
      const newBytes = this.bytes + bytes;

      if (newBytes > byteLimit) {
        if (bytes > byteLimit) {
          return callback(new Error(`item too large: ${bytes} vs ${byteLimit}`));
        }

        const batch = this.getBatch();

        this.items.push(item);
        this.bytes = bytes;

        return callback(null, batch);
      } else if (newBytes === byteLimit) {
        this.items.push(item);

        const batch = this.getBatch();

        return callback(null, batch);
      } else {
        this.bytes = newBytes;
      }
    }

    this.items.push(item);

    if (this.itemLimit && (this.items.length === this.itemLimit)) {
      const batch = this.getBatch();
      return callback(null, batch);
    }
    
    if (this.timeLimit) {
      this.startTimeout();
    }

    return callback();
  }

  _flush(callback) {
    this.flushBatch();
    return callback();
  }

  getBatch() {
    this.cancelTimeout();
    this.timedout = false;

    if (this.items.length) {
      const batch = this.items;

      this.items = [];
      this.bytes = 0;

      return batch;
    }
  }

  cancelTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      delete this.timeout;
    }
  }

  startTimeout() {
    if (this.timeout) {
      return;
    }

    this.timeout = setTimeout(() => {
      delete this.timeout;

      if (this.backpressure) {
        this.timedout = true;
      } else {
        this.flushBatch();
      }
    }, this.timeLimit);
  }

  flushBatch() {
    const batch = this.getBatch();

    if (batch) {
      if (this.push(batch) === false) {
        this.backpressure = true;
      }
    }
  }

};

module.exports = function batches(options = {}) {
  return new BatchedTransform(options.limit, options.byteCount);
};
