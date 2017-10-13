'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');

const arrayStream = require('./helpers/array-stream');
const batches = require('..');

test('sends everything in one batch when less items than limit', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['a', 'b', 'c'])
      .pipe(batches({ limit: { items: 10 } }))
      .on('data', onData)
      .on('finish', () =>  resolve())
    })
    .then(() => {
      t.true(onData.calledOnce);
      t.deepEqual(onData.firstCall.args[0], ['a', 'b', 'c']);
    });
});

test('sends multiple batches when item size exceded', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['a', 'b', 'c'])
    .pipe(batches({ limit: { items: 2 } }))
    .on('data', onData)
    .on('finish', () => resolve())
  })
  .then(() => {
    t.true(onData.calledTwice);
    t.deepEqual(onData.firstCall.args[0], ['a', 'b']);
    t.deepEqual(onData.secondCall.args[0], ['c']);
  });
});
