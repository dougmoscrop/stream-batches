'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');
const intoStream = require('into-stream');
const pump = require('pump-promise');
const brake = require('chunk-brake');

const batches = require('..');

test('completes if stream is done before time limit occurs', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b', 'c']),
    brake(100, { objectMode: true }),
    batches({ limit: { time: 500 } }).on('data', onData),
  ).then(() => {
    t.deepEqual(onData.callCount, 1);
    t.deepEqual(onData.firstCall.args[0], ['a', 'b', 'c']);
  });
});

test('flushes at time limit', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b', 'c']),
    brake(100, { objectMode: true }),
    batches({ limit: { time: 150 } }).on('data', onData),
  ).then(() => {
    t.deepEqual(onData.callCount, 2);
    t.deepEqual(onData.firstCall.args[0], ['a', 'b']);
    t.deepEqual(onData.secondCall.args[0], ['c']);
  });
});

test('flushes at multiple time limits', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b', 'c']),
    brake(100, { objectMode: true }),
    batches({ limit: { time: 75 } }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.callCount, 3);
    t.deepEqual(onData.firstCall.args[0], ['a']);
    t.deepEqual(onData.secondCall.args[0], ['b']);
    t.deepEqual(onData.thirdCall.args[0], ['c']);
  });
});
