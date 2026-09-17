export function computeQuotationTotals(items = []) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;

  const normalizedItems = items.map((item) => {
    const qty = Number(item.qty || 0);
    const rate = Number(item.rate || 0);
    let discountPct = Number(item.discount_pct || item.discountPct || 0);
    
    // Check if item has explicit discounted_price
    const rawDiscPrice = item.discounted_price !== undefined && item.discounted_price !== null && item.discounted_price !== ''
      ? Number(item.discounted_price)
      : (item.custom_fields && item.custom_fields.discounted_price !== undefined && item.custom_fields.discounted_price !== ''
          ? Number(item.custom_fields.discounted_price)
          : null);

    let effectiveUnitPrice = rate;
    if (rawDiscPrice !== null && !isNaN(rawDiscPrice)) {
      effectiveUnitPrice = rawDiscPrice;
      if (rate > 0) {
        discountPct = Number((((rate - effectiveUnitPrice) / rate) * 100).toFixed(4));
      }
    } else if (discountPct > 0) {
      effectiveUnitPrice = rate * (1 - discountPct / 100);
    }

    const base = qty * (rate > 0 ? rate : effectiveUnitPrice);
    const net = qty * effectiveUnitPrice;
    const discountAmount = (base - net) > 0 ? (base - net) : 0;
    const gstPct = Number(item.gst_pct || item.gstPct || 0);
    const gstAmount = (net * gstPct) / 100;
    const lineTotal = net + gstAmount;

    subtotal += (base > 0 ? base : net);
    totalDiscount += discountAmount;
    totalGst += gstAmount;

    const customFields = typeof item.custom_fields === 'object' && item.custom_fields !== null
      ? { ...item.custom_fields }
      : {};
    if (rawDiscPrice !== null) {
      customFields.discounted_price = rawDiscPrice;
    }

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
      discounted_price: rawDiscPrice !== null ? rawDiscPrice : effectiveUnitPrice,
      discount_pct: discountPct,
      gst_pct: gstPct,
      line_total: Number(lineTotal.toFixed(2)),
      custom_fields: customFields,
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
