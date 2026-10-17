import assert from 'node:assert/strict';
import test from 'node:test';
import { copyEmailToClipboard } from '../src/components/home/copyEmail';

const expectedEmail = 'your-email@example.com';

test('success writes the complete email and preserves the clipboard receiver', async () => {
  const writes: string[] = [];
  const clipboard = {
    async writeText(value: string) {
      assert.equal(this, clipboard);
      writes.push(value);
    },
  };

  assert.equal(await copyEmailToClipboard(expectedEmail, clipboard), true);
  assert.deepEqual(writes, [expectedEmail]);
});

test('success waits for the write promise to finish', async () => {
  let finishWrite!: () => void;
  const pendingWrite = new Promise<void>(resolve => { finishWrite = resolve; });
  let settled = false;
  const result = copyEmailToClipboard(expectedEmail, {
    writeText: () => pendingWrite,
  }).then(value => {
    settled = true;
    return value;
  });

  await Promise.resolve();
  assert.equal(settled, false);
  finishWrite();
  assert.equal(await result, true);
});

test('a rejected write returns failure without an unhandled rejection', async () => {
  const writes: string[] = [];
  const clipboard = {
    async writeText(value: string) {
      writes.push(value);
      throw new Error('Mock permission denial');
    },
  };

  assert.equal(await copyEmailToClipboard(expectedEmail, clipboard), false);
  assert.deepEqual(writes, [expectedEmail]);
});

test('a missing clipboard returns failure', async () => {
  assert.equal(await copyEmailToClipboard(expectedEmail, undefined), false);
});

test('a missing writeText method returns failure', async () => {
  const clipboard = {} as Pick<Clipboard, 'writeText'>;
  assert.equal(await copyEmailToClipboard(expectedEmail, clipboard), false);
});
