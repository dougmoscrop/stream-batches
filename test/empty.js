'use strict';

const stream = require('stream');

const test = require('ava');
const sinon = require('sinon');
const pump = require('pump-promise');
const intoStream = require('into-stream');

const batches = require('..');

test('finishes when main stream closes', t => {
  const onData = sinon.stub();

  return pump(
    intoStream.obj([]),
    batches({ limit: { bytes: 5 } }).on('data', onData)
  ).then(() => {
    t.deepEqual(onData.called, false);
  });
});
