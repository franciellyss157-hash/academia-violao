const crypto = require('crypto');

const DAILY_RECEIPT_LIMIT = Number(process.env.RECEIPT_DAILY_LIMIT || 3);
const REJECTION_FLAG_THRESHOLD = 3;

function receiptHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function amountsDiffer(expected, informed) {
  if (informed === null || informed === undefined || informed === '') return true;
  return Math.round(Number(expected) * 100) !== Math.round(Number(informed) * 100);
}

function orderCode(random = crypto.randomBytes(3).toString('hex')) {
  return `SS-${random.toUpperCase()}`;
}

/**
 * Regras antifraude aplicadas no envio de um comprovante.
 * Retorna a lista de alertas (flags) para o ADM e se o pedido deve ser sinalizado.
 */
function evaluateReceipt({ expectedAmount, informedAmount, hash, existingHashes, receiptsToday }) {
  const flags = [];
  if (existingHashes.includes(hash)) flags.push('comprovante já usado');
  if (amountsDiffer(expectedAmount, informedAmount)) flags.push('valor divergente');
  if (receiptsToday >= DAILY_RECEIPT_LIMIT) flags.push('limite diário excedido');
  return {
    flags,
    blocked: flags.includes('limite diário excedido'),
    duplicate: flags.includes('comprovante já usado'),
    mismatch: flags.includes('valor divergente'),
  };
}

function shouldFlagUser(consecutiveRejections) {
  return consecutiveRejections >= REJECTION_FLAG_THRESHOLD;
}

module.exports = {
  DAILY_RECEIPT_LIMIT,
  REJECTION_FLAG_THRESHOLD,
  receiptHash,
  amountsDiffer,
  orderCode,
  evaluateReceipt,
  shouldFlagUser,
};
