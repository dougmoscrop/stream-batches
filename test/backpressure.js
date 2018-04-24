'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');
const brake = require('chunk-brake');
const pump = require('pump-promise');
const intoStream = require('into-stream');

const batches = require('..');

test('completes if stream is done before time limit occurs', t => {
  const writes = [];

  const begin = new Date().getTime();

  const destination = new stream.Writable({
    objectMode: true,
    highWaterMark: 1,
    write: function(chunk, enc, cb) {
      setTimeout(() => {
        const end = new Date().getTime();

        chunk.forEach(c => {
          writes.push(Object.assign(c, {
            dwell: end - c.start,
            overall: end - begin
          }));
        });
        cb();
      }, 100);
    }
  });

  let count = 0;
  const source = new stream.Readable({
    objectMode: true,
    highWaterMark: 10,
    read: function() {
      if (count === 40) {
        this.push(null);
      } else {
        const start = new Date().getTime();

        this.push({
          count,
          start,
          begin,
          offset: start - begin
        });
      }

      count++;
    }
  });

  return pump(
    source,
    brake(10, { objectMode: true }),
    batches({ limit: { items: 10, time: 25 } }),
    destination
  )
  .then(() => {
    // ordered, etc.
    t.deepEqual(writes.map(w => w.count), Array(40).fill().map((v, i) => i))
  });
});
