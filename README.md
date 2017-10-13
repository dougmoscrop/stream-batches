# stream-batches

This is an object-mode stream that collects chunks and flushes them as batches.

Flushing happens either when the incoming stream is done, or when a limit is reached.

There are three kinds of limits: `bytes`, `items` and `time`. More than one limit can be active, and a flush occurs when any of them are hit.

## Example

Send batches of 10 items through - this is the default behavior.

```js
mySource
  .pipe(batches({ limit: { items: 10 } }))
  .pipe(myDestination)
```

Collect (up to) 1 MB worth of records:

```js
mySource
  .pipe(batches({ limit: { bytes: 1 * 1024 * 1024 } }))
  .pipe(myDestination)
```

Collect up to 100 records no larger than 256kb but don't wait longer than 500ms

```js
mySource
  .pipe(batches({ limit: { items: 100, bytes: 256 * 1024, time: 500 } }))
  .pipe(myDestination)
```

## Byte Count

When using a byte limit, the default counter is `Buffer.byteLength`. This can be customized with a `byteCount` function passed in via options.

This inflates the byte count by 2 for each record:

```js
mySource
  .pipe(batches({ limit: { bytes: 256 }, byteCount: r => Buffer.byteLength(r) + 2 }))
  .pipe(myDestination)
```

This might be useful if you're sending a request that has a payload limit, and you want to factor in the overhead of JSON.stringify on the batched array.

## Item Over Limit

If an individual item is larger than the byte limit, the default behavior is to raise an error. You can override this by attaching a listener to the `overlimit` event:

```js
mySource.
  .pipe(batches())
  .on('overlimit', item => logger.warn('skipping an item because it is too big!', item)
  .pipe(myDestination)
```
