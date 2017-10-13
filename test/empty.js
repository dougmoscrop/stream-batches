'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');

const arrayStream = require('./helpers/array-stream');
const batches = require('..');

test('finishes when main stream closes', t => {
  const onData = sinon.stub();

  return new Promise(resolve => {
    arrayStream([])
      .pipe(batches({ limit: { bytes: 5 } }))
      .on('data', onData)
      .on('finish', () => resolve())
    })
    .then(() => {
      t.false(onData.called);
    });
});
