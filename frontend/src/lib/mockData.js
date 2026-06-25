export const dashboardStats = [
  { label: 'Total Inquiries', value: 148 },
  { label: 'Quotations', value: 63 },
  { label: 'Customers', value: 91 },
  { label: "Today's Tasks", value: 12 },
  { label: 'Conversion Rate', value: '38%' },
];

export const inquiryPipeline = [
  { name: 'New', value: 42 },
  { name: 'Follow-up', value: 31 },
  { name: 'Converted', value: 18 },
  { name: 'Lost', value: 7 },
];

export const quotationStatus = [
  { name: 'Draft', value: 14 },
  { name: 'Sent', value: 20 },
  { name: 'Approved', value: 16 },
  { name: 'Rejected', value: 5 },
  { name: 'Converted', value: 8 },
];

export const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Inquiries & Quotations', path: '/inquiries' },
  { label: 'Inquiry Sources', path: '/inquiry-sources' },
  { label: 'CRM', path: '/crm' },
  { label: 'Customers', path: '/customers' },
  { label: 'Products', path: '/products' },
  { label: 'Product Groups', path: '/product-groups' },
  { label: 'Reminders', path: '/reminders' },
  { label: 'Reports', path: '/reports' },
  { label: 'Users', path: '/users' },
  { label: 'Settings', path: '/settings' },
];

export const sampleRows = {
  inquiries: [
    { id: 'INQ-001', customer: 'Rahul Traders', source: 'WhatsApp', status: 'new', assigned: 'Admin User' },
    { id: 'INQ-002', customer: 'Apex Build', source: 'Facebook', status: 'follow_up', assigned: 'Sales User' },
  ],
  quotations: [
    { id: 'QT-0001', customer: 'Rahul Traders', amount: 125000, status: 'sent', assigned: 'Admin User' },
    { id: 'QT-0002', customer: 'Apex Build', amount: 84000, status: 'approved', assigned: 'Sales User' },
  ],
  reminders: [
    { id: 'RMD-001', title: 'Follow up QT-0001', type: 'Quotation Follow-up', date: '2026-04-20 10:30', status: 'pending' },
    { id: 'RMD-002', title: 'Payment reminder INV-003', type: 'Payment Reminder', date: '2026-04-21 12:00', status: 'overdue' },
  ],
};
