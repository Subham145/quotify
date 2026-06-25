export function computeQuotationTotals(items = []) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;

  const normalizedItems = items.map((item) => {
    const qty = Number(item.qty || 0);
    const rate = Number(item.rate || 0);
    const discountPct = Number(item.discount_pct || item.discountPct || 0);
    const gstPct = Number(item.gst_pct || item.gstPct || 0);

    const base = qty * rate;
    const discountAmount = (base * discountPct) / 100;
    const afterDiscount = base - discountAmount;
    const gstAmount = (afterDiscount * gstPct) / 100;
    const lineTotal = afterDiscount + gstAmount;

    subtotal += base;
    totalDiscount += discountAmount;
    totalGst += gstAmount;

  return {
  product_id: item.product_id || item.productId || null,
  description: item.description || '',

  model: item.model || '',
  motor_hp: item.motor_hp || item.hp || '',
  head: item.head || '',
  flow_rate: item.flow_rate || item.flow || '',
  size: item.size || '',

  qty,
  rate,
  discount_pct: discountPct,
  gst_pct: gstPct,
  line_total: Number(lineTotal.toFixed(2)),
};
  });

  const totalAmount = subtotal - totalDiscount + totalGst;

  return {
    items: normalizedItems,
    subtotal: Number(subtotal.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalGst: Number(totalGst.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

export function todayIsoDateTime() {
  return new Date().toISOString();
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => escape(r[h])).join(',')));
  return lines.join('\n');
}
