'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');
const intoStream = require('into-stream');
const pump = require('pump-promise');

const batches = require('..');

test('sends everything in one batch when less items than limit', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b', 'c']),
    batches().on('data', onData)
  ).then(() => {
    t.true(onData.calledOnce);
    t.deepEqual(onData.firstCall.args[0], ['a', 'b', 'c']);
  });
});

test('sends multiple batches when item size exceded', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj(['a', 'b', 'c']),
    batches({ limit: { items: 2 } }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.callCount, 2);
    t.deepEqual(onData.firstCall.args[0], ['a', 'b']);
    t.deepEqual(onData.secondCall.args[0], ['c']);
  });
});
