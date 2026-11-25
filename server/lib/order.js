function shapeOrder(o) {
  if (!o) return null;
  return {
    id: o.id,
    code: o.code,
    packageId: o.package_id,
    amount: Number(o.amount),
    status: o.status,
    receiptUrl: o.receipt_url,
    amountPaid: o.amount_paid === null ? null : Number(o.amount_paid),
    payerName: o.payer_name,
    rejectReason: o.reject_reason,
    flags: o.flags || [],
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    reviewedAt: o.reviewed_at,
    userName: o.user_name,
    userEmail: o.user_email,
  };
}

module.exports = { shapeOrder };
