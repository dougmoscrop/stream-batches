'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');
const intoStream = require('into-stream');
const pump = require('pump-promise');

const batches = require('..');

test('sends one batch when total items are less than limit', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b', 'c']),
    batches({ limit: { bytes: 5 } }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.callCount, 1);
    t.deepEqual(onData.firstCall.args[0], ['a', 'b', 'c']);
  });
});

test('flushes when byte limit is exceeded mid-way', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['asdf', 'bc', 'd']),
    batches({ limit: { bytes: 5 } }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.callCount, 2);
    t.deepEqual(onData.firstCall.args[0], ['asdf']);
    t.deepEqual(onData.secondCall.args[0], ['bc', 'd']);
  });
});

test('flushes when byte limit is reached exactly', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['asdf', 'b', 'c']),
    batches({ limit: { bytes: 5 } }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.callCount, 2);
    t.deepEqual(onData.firstCall.args[0], ['asdf', 'b']);
    t.deepEqual(onData.secondCall.args[0], ['c']);
  });
});

test('throws when individual item is larger than byte limit', t => {
  return pump(
    intoStream.obj(['asdf']),
    batches({ limit: { bytes: 2 } })
  ).then(() => {
    t.fail('expected an error');
  })
  .catch(caught => {
    t.deepEqual(caught.message, 'item too large: 4 vs 2');
  });
});

test('custom byte count', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b']),
    batches({ limit: { bytes: 2 }, byteCount: i => 2 }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.callCount, 2);
    t.deepEqual(onData.firstCall.args[0], ['a']);
    t.deepEqual(onData.secondCall.args[0], ['b']);
  });
});