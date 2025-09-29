// app/compose/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Combobox } from '@/components/ui/combobox';
import { CheckCircle2, AlertCircle, Copy, Download, X } from 'lucide-react';

// Sample data
const DEBTORS = [
  { value: 'acme-inc', label: 'Acme Inc', account: 'US1234567890ACME' },
  { value: 'globex-llc', label: 'Globex LLC', account: 'US0987654321GLBX' },
  { value: 'wayne-corp', label: 'Wayne Corp', account: 'US1122334455WYNC' },
  { value: 'stark-ind', label: 'Stark Industries', account: 'US9988776655STRK' },
  { value: 'oscorp', label: 'Oscorp', account: 'US5544332211OSCP' },
  { value: 'umbrella', label: 'Umbrella Corporation', account: 'US6677889900UMBC' },
  { value: 'initech', label: 'Initech', account: 'US2233445566INTC' },
  { value: 'massive-dynamic', label: 'Massive Dynamic', account: 'US7788990011MDYN' },
];

const CREDITORS = [
  { value: 'tyrell-corp', label: 'Tyrell Corp', account: 'US2233445566TYRL' },
  { value: 'cyberdyne', label: 'Cyberdyne Systems', account: 'US3344556677CYBD' },
  { value: 'weyland', label: 'Weyland-Yutani', account: 'US4455667788WYLD' },
  { value: 'abstergo', label: 'Abstergo Industries', account: 'US5566778899ABST' },
  { value: 'hooli', label: 'Hooli', account: 'US6677889900HOOL' },
  { value: 'piedpiper', label: 'Pied Piper', account: 'US7788990011PPPR' },
  { value: 'e-corp', label: 'E Corp', account: 'US8899001122ECRP' },
  { value: 'buy-n-large', label: 'Buy n Large', account: 'US9900112233BNLG' },
];

const paymentSchema = z.object({
  rail: z.enum(['FEDNOW', 'RTP', 'SWIFT']),
  debtorName: z.string().min(1, 'Debtor name is required'),
  debtorAccount: z.string().min(1, 'Debtor account is required'),
  creditorName: z.string().min(1, 'Creditor name is required'),
  creditorAccount: z.string().min(1, 'Creditor account is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  purpose: z.string().optional(),
  remittance: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function ComposePage() {
  const [recentPayments, setRecentPayments] = useState([
    { rail: 'SWIFT', amount: '9999.99 EUR', parties: 'Blue Sun → Tyrell Corp', time: '9/26/2025, 1:51:48 PM' },
    { rail: 'FEDNOW', amount: '1250.55 USD', parties: 'Acme Inc → Globex LLC', time: '9/26/2025, 1:51:48 PM' },
    { rail: 'RTP', amount: '420 USD', parties: 'Wayne Corp → Stark Industries', time: '9/26/2025, 1:51:48 PM' },
  ]);

  const [showXmlModal, setShowXmlModal] = useState(false);
  const [xmlData, setXmlData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pain001' | 'pacs008'>('pain001');

  // Create account-focused options for the account dropdowns
  const debtorAccounts = DEBTORS.map(d => ({
    value: d.account,
    label: d.account,
    account: d.label
  }));

  const creditorAccounts = CREDITORS.map(c => ({
    value: c.account,
    label: c.account,
    account: c.label
  }));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      rail: 'FEDNOW',
      currency: 'USD',
      amount: '100.00',
      purpose: 'GDDS',
      debtorName: '',
      debtorAccount: '',
      creditorName: '',
      creditorAccount: ''
    }
  });

  const watchDebtorName = watch('debtorName');
  const watchCreditorName = watch('creditorName');

  useEffect(() => {
    const debtor = DEBTORS.find(d => d.label === watchDebtorName);
    if (debtor && debtor.account) {
      setValue('debtorAccount', debtor.account, { shouldValidate: true });
    }
  }, [watchDebtorName, setValue]);

  useEffect(() => {
    const creditor = CREDITORS.find(c => c.label === watchCreditorName);
    if (creditor && creditor.account) {
      setValue('creditorAccount', creditor.account, { shouldValidate: true });
    }
  }, [watchCreditorName, setValue]);

  // UPDATED onSubmit function with localStorage saving
  const onSubmit = async (data: PaymentFormData) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        // Add to recent payments
        const newPayment = {
          rail: data.rail,
          amount: `${data.amount} ${data.currency}`,
          parties: `${data.debtorName} → ${data.creditorName}`,
          time: new Date().toLocaleString()
        };
        setRecentPayments([newPayment, ...recentPayments.slice(0, 5)]);
        
        // Save to localStorage for tracking
        const paymentRecord = {
          id: result.payment.id,
          uetr: result.payment.uetr,
          rail: data.rail,
          amount: data.amount,
          currency: data.currency,
          debtorName: data.debtorName,
          creditorName: data.creditorName,
          status: 'CREATED',
          createdAt: new Date().toISOString()
        };

        const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
        localStorage.setItem('payments', JSON.stringify([paymentRecord, ...existingPayments]));
        
        // Show XML modal
        setXmlData(result);
        setShowXmlModal(true);
        setActiveTab('pain001');
      } else {
        alert('Error: ' + (result.errors?.join(', ') || 'Failed to process payment'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDebtorNameChange = (name: string, account?: string) => {
    setValue('debtorName', name, { shouldValidate: true });
    if (account) {
      setValue('debtorAccount', account, { shouldValidate: true });
    }
  };

  const handleDebtorAccountChange = (account: string, name?: string) => {
    setValue('debtorAccount', account, { shouldValidate: true });
    if (name) {
      setValue('debtorName', name, { shouldValidate: true });
    }
  };

  const handleCreditorNameChange = (name: string, account?: string) => {
    setValue('creditorName', name, { shouldValidate: true });
    if (account) {
      setValue('creditorAccount', account, { shouldValidate: true });
    }
  };

  const handleCreditorAccountChange = (account: string, name?: string) => {
    setValue('creditorAccount', account, { shouldValidate: true });
    if (name) {
      setValue('creditorName', name, { shouldValidate: true });
    }
  };

  const downloadXML = (xmlContent: string, filename: string) => {
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">ISO 20022 Payments — Compose & View</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rail
                  </label>
                  <select
                    {...register('rail')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FEDNOW">FEDNOW</option>
                    <option value="RTP">RTP</option>
                    <option value="SWIFT">SWIFT</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    {...register('currency')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Debtor Name
                </label>
                <Combobox
                  options={DEBTORS}
                  value={watch('debtorName')}
                  onValueChange={handleDebtorNameChange}
                  placeholder="Select or type debtor name..."
                  searchPlaceholder="Search debtors..."
                  allowCustom={true}
                />
                {errors.debtorName && (
                  <p className="text-red-500 text-xs mt-1">{errors.debtorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Debtor Account
                </label>
                <Combobox
                  options={debtorAccounts}
                  value={watch('debtorAccount')}
                  onValueChange={handleDebtorAccountChange}
                  placeholder="Select or type account number..."
                  searchPlaceholder="Search accounts..."
                  allowCustom={true}
                />
                {errors.debtorAccount && (
                  <p className="text-red-500 text-xs mt-1">{errors.debtorAccount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Creditor Name
                </label>
                <Combobox
                  options={CREDITORS}
                  value={watch('creditorName')}
                  onValueChange={handleCreditorNameChange}
                  placeholder="Select or type creditor name..."
                  searchPlaceholder="Search creditors..."
                  allowCustom={true}
                />
                {errors.creditorName && (
                  <p className="text-red-500 text-xs mt-1">{errors.creditorName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Creditor Account
                </label>
                <Combobox
                  options={creditorAccounts}
                  value={watch('creditorAccount')}
                  onValueChange={handleCreditorAccountChange}
                  placeholder="Select or type account number..."
                  searchPlaceholder="Search accounts..."
                  allowCustom={true}
                />
                {errors.creditorAccount && (
                  <p className="text-red-500 text-xs mt-1">{errors.creditorAccount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  {...register('amount')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remittance (optional)
                </label>
                <textarea
                  {...register('remittance')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Enter remittance information"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose (e.g., GDDS, TRAD)
                </label>
                <input
                  type="text"
                  {...register('purpose')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GDDS"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Create Payment'}
              </button>
            </form>
          </div>

          {/* Right Column - Recent Payments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>
            <div className="space-y-3">
              {recentPayments.map((payment, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">
                          {payment.rail}
                        </span>
                        <span className="text-sm font-semibold">
                          — {payment.amount}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {payment.parties}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {payment.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a
                href="/payments"
                className="block text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
              >
                View All Payments →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* XML Modal */}
      {showXmlModal && xmlData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Payment Created Successfully!</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Payment ID: {xmlData.payment?.id} | UETR: {xmlData.payment?.uetr}
                  </p>
                </div>
                <button
                  onClick={() => setShowXmlModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Validation Results */}
              {xmlData.validation?.warnings?.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Warnings:</p>
                    {xmlData.validation.warnings.map((warning: string, idx: number) => (
                      <p key={idx} className="text-sm text-yellow-700">{warning}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setActiveTab('pain001')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'pain001' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  pain.001 (Customer Initiation)
                </button>
                <button
                  onClick={() => setActiveTab('pacs008')}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === 'pacs008' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  pacs.008 (Interbank Transfer)
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto max-h-[60vh]">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-xs overflow-auto">
                {activeTab === 'pain001' ? xmlData.xml?.pain001 : xmlData.xml?.pacs008}
              </pre>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => copyToClipboard(
                    activeTab === 'pain001' ? xmlData.xml?.pain001 : xmlData.xml?.pacs008
                  )}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy XML
                </button>
                <button
                  onClick={() => downloadXML(
                    activeTab === 'pain001' ? xmlData.xml?.pain001 : xmlData.xml?.pacs008,
                    `${activeTab}_${xmlData.payment?.id}.xml`
                  )}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download XML
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
