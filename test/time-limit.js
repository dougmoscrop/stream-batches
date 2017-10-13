'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');

const arrayStream = require('./helpers/array-stream');
const batches = require('..');

test('completes if stream is done before time limit occurs', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['a', 'b', 'c'], 100)
      .pipe(batches({ limit: { time: 500 } }))
      .on('data', onData)
      .on('finish', () => resolve())
    })
    .then(() => {
      t.true(onData.calledOnce);
      t.deepEqual(onData.firstCall.args[0], ['a', 'b', 'c']);
    });
});

test('flushes at time limit', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['a', 'b', 'c'], 100)
      .pipe(batches({ limit: { time: 250 } }))
      .on('data', onData)
      .on('finish', () => resolve())
    })
    .then(() => {
      t.true(onData.calledTwice);
      t.deepEqual(onData.firstCall.args[0], ['a', 'b']);
      t.deepEqual(onData.secondCall.args[0], ['c']);
    });
});

test('flushes at multiple time limits', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['a', 'b', 'c'], 200)
      .pipe(batches({ limit: { time: 100 } }))
      .on('data', onData)
      .on('finish', () => resolve())
    })
    .then(() => {
      t.true(onData.calledThrice);
      t.deepEqual(onData.firstCall.args[0], ['a']);
      t.deepEqual(onData.secondCall.args[0], ['b']);
      t.deepEqual(onData.thirdCall.args[0], ['c']);
    });
});
