'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');

const arrayStream = require('./helpers/array-stream');
const batches = require('..');

test('sends one batch when total items are less than limit', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['a', 'b', 'c'])
      .pipe(batches({ limit: { bytes: 5 } }))
      .on('data', onData)
      .on('finish', () => resolve())
    })
    .then(() => {
      t.true(onData.calledOnce);
      t.deepEqual(onData.firstCall.args[0], ['a', 'b', 'c']);
    });
});

test('flushes when byte limit is reached', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream(['asdf', 'b', 'c'])
      .pipe(batches({ limit: { bytes: 5 } }))
      .on('data', onData)
      .on('finish', () => resolve())
    })
    .then(() => {
      t.true(onData.calledTwice);
      t.deepEqual(onData.firstCall.args[0], ['asdf', 'b']);
      t.deepEqual(onData.secondCall.args[0], ['c']);
    });
});

test('throws when individual item is larger than byte limit', t => {
  return new Promise(resolve => {
    arrayStream(['asdf'])
      .pipe(batches({ limit: { bytes: 2 } }))
      .on('data', () => reject('should not have got data'))
      .on('error', err => resolve(err))
    })
    .then(caught => {
      t.deepEqual(caught.message, 'item too large: 4 vs 2');
    });
});
