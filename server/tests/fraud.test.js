const test = require('node:test');
const assert = require('node:assert');
const {
  evaluateReceipt,
  amountsDiffer,
  orderCode,
  receiptHash,
  shouldFlagUser,
} = require('../lib/fraud');

test('detecta comprovante já usado em outro pedido', () => {
  const hash = receiptHash(Buffer.from('comprovante-1'));
  const verdict = evaluateReceipt({
    expectedAmount: 0.99,
    informedAmount: 0.99,
    hash,
    existingHashes: [hash],
    receiptsToday: 0,
  });
  assert.equal(verdict.duplicate, true);
  assert.ok(verdict.flags.includes('comprovante já usado'));
});

test('sinaliza valor divergente', () => {
  const verdict = evaluateReceipt({
    expectedAmount: 1.99,
    informedAmount: 0.99,
    hash: 'x',
    existingHashes: [],
    receiptsToday: 0,
  });
  assert.equal(verdict.mismatch, true);
  assert.ok(verdict.flags.includes('valor divergente'));
});

test('aceita valor com arredondamento de centavos', () => {
  assert.equal(amountsDiffer(0.99, '0.990'), false);
  assert.equal(amountsDiffer(1.99, 1.9), true);
  assert.equal(amountsDiffer(1.99, ''), true);
});

test('bloqueia quando passa do limite diário', () => {
  const verdict = evaluateReceipt({
    expectedAmount: 0.99,
    informedAmount: 0.99,
    hash: 'x',
    existingHashes: [],
    receiptsToday: 3,
  });
  assert.equal(verdict.blocked, true);
});

test('gera código único de pedido no formato SS-XXXXXX', () => {
  assert.equal(orderCode('a1b2c3'), 'SS-A1B2C3');
  const codes = new Set(Array.from({ length: 200 }, () => orderCode()));
  assert.ok(codes.size > 190, 'os códigos devem ser praticamente únicos');
  for (const code of codes) assert.match(code, /^SS-[A-F0-9]{6}$/);
});

test('marca usuário após 3 recusas seguidas', () => {
  assert.equal(shouldFlagUser(2), false);
  assert.equal(shouldFlagUser(3), true);
});
