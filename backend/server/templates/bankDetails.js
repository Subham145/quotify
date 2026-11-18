// Centralized Official Bank Details for All Quotation Templates
export const BANK_DETAILS = {
  accountHolder: 'Pareek Power & Pumps Pvt Ltd.',
  accountNumber: '9893375656',
  bankName: 'Kotak Mahindra Bank',
  ifscCode: 'KKBK0005951',
  branch: '205-The Grace, Kibe Compound, Shreemaya Square, Indore - 452001',
  gstin: '23AACCP0309E1Z5'
};

export function getBankTableHtml() {
  return `
    <table class="bank-table">
      <tr>
        <td class="label-col">BANK NAME</td>
        <td>${BANK_DETAILS.bankName}</td>
      </tr>
      <tr>
        <td class="label-col">ACCOUNT HOLDER</td>
        <td>${BANK_DETAILS.accountHolder}</td>
      </tr>
      <tr>
        <td class="label-col">A/C NO.</td>
        <td>${BANK_DETAILS.accountNumber}</td>
      </tr>
      <tr>
        <td class="label-col">IFSC CODE</td>
        <td>${BANK_DETAILS.ifscCode}</td>
      </tr>
      <tr>
        <td class="label-col">BRANCH / BANK ADD.</td>
        <td>${BANK_DETAILS.branch}</td>
      </tr>
      <tr>
        <td class="label-col">GSTIN NO.</td>
        <td>${BANK_DETAILS.gstin}</td>
      </tr>
    </table>
  `;
}

export function getBankDetailsBoxHtml(style = '') {
  return `
    <div class="bank-details-box" style="margin-top: 6px; padding: 5px 8px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 3px solid #0284c7; font-size: 10px; color: #1e293b; line-height: 1.45; border-radius: 2px; ${style}">
      <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">Bank Details for RTGS / NEFT Payment:</div>
      <div><b>Bank:</b> ${BANK_DETAILS.bankName} | <b>A/c No:</b> ${BANK_DETAILS.accountNumber} | <b>IFSC:</b> ${BANK_DETAILS.ifscCode}</div>
      <div><b>Beneficiary:</b> ${BANK_DETAILS.accountHolder} | <b>Branch:</b> ${BANK_DETAILS.branch}</div>
    </div>
  `;
}
