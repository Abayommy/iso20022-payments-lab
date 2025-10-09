'use client';

import { useState, useEffect } from 'react';

interface Event {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Payment {
  id: string;
  uetr: string;
  rail: string;
  amount: number;
  currency: string;
  debtorName: string;
  debtorAccount: string;
  creditorName: string;
  creditorAccount: string;
  status: string;
  createdAt: string;
  events?: Event[];
}

interface TestSettings {
  autoProgress: boolean;
  progressSpeed: number;
  failureRate: number;
  pauseAtStatus: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [testSettings, setTestSettings] = useState<TestSettings>({
    autoProgress: true,
    progressSpeed: 1,
    failureRate: 0,
    pauseAtStatus: null
  });

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, action: string, status?: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          status,
          simulateFailure: testSettings.failureRate > 0 
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Status updated:', result.message);
        fetchPayments(); // Refresh the list
        if (selectedPayment?.id === paymentId) {
          setSelectedPayment(result.payment);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CREATED': 'bg-blue-100 text-blue-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      'CREATED': '📝',
      'PENDING': '⏳',
      'PROCESSING': '⚙️',
      'COMPLETED': '✅',
      'FAILED': '❌'
    };
    return icons[status] || '📄';
  };

  const filteredPayments = selectedFilter === 'All' 
    ? payments 
    : payments.filter(p => p.status === selectedFilter);
// Auto-progress effect
  useEffect(() => {
    if (!testSettings.autoProgress) return;

    const baseInterval = 5000; // 5 seconds base
    const interval = baseInterval / testSettings.progressSpeed;

    const autoAdvance = async () => {
      // Fetch current payments to check pause status
      try {
        const response = await fetch('/api/payments');
        const currentPayments = await response.json();
        
        // Check if we should pause
        if (testSettings.pauseAtStatus) {
          const hasPaymentAtPauseStatus = currentPayments.some((p: Payment) => p.status === testSettings.pauseAtStatus);
          if (hasPaymentAtPauseStatus) {
            return; // Don't advance if there's a payment at pause status
          }
        }

        // Call the batch advance endpoint
        await fetch('/api/payments/batch/advance', { method: 'POST' });
      } catch (error) {
        console.error('Auto-advance error:', error);
      }
    };

    const timer = setInterval(autoAdvance, interval);
    return () => clearInterval(timer);
  }, [testSettings.autoProgress, testSettings.progressSpeed, testSettings.pauseAtStatus]);
  const filters = ['All', 'CREATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Tracking</h1>
          <p className="text-gray-600">Monitor payment lifecycle and status</p>
        </div>
        
        {/* Control Panel Toggle */}
        <button
          onClick={() => setShowControlPanel(!showControlPanel)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Test Controls
        </button>
      </div>

      {/* Test Control Panel */}
      {showControlPanel && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-indigo-900">🎮 Testing Control Panel</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Auto Progress Settings */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-3">Auto Progress</h4>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={testSettings.autoProgress}
                  onChange={(e) => setTestSettings({...testSettings, autoProgress: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>Enable Auto Progress</span>
              </label>
              
              <label className="block mb-2">
                <span className="text-sm text-gray-600">Speed Multiplier</span>
                <select 
                  value={testSettings.progressSpeed}
                  onChange={(e) => setTestSettings({...testSettings, progressSpeed: Number(e.target.value)})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="0.5">0.5x (Slower)</option>
                  <option value="1">1x (Normal)</option>
                  <option value="2">2x (Faster)</option>
                  <option value="5">5x (Very Fast)</option>
                </select>
              </label>
            </div>

            {/* Failure Simulation */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-3">Failure Simulation</h4>
              <label className="block mb-2">
                <span className="text-sm text-gray-600">Failure Rate</span>
                <select 
                  value={testSettings.failureRate}
                  onChange={(e) => setTestSettings({...testSettings, failureRate: Number(e.target.value)})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="0">0% (No Failures)</option>
                  <option value="0.1">10% Failure Rate</option>
                  <option value="0.3">30% Failure Rate</option>
                  <option value="0.5">50% Failure Rate</option>
                </select>
              </label>
              
              <label className="block">
                <span className="text-sm text-gray-600">Pause At Status</span>
                <select 
                  value={testSettings.pauseAtStatus || ''}
                  onChange={(e) => setTestSettings({...testSettings, pauseAtStatus: e.target.value || null})}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="">No Pause</option>
                  <option value="PENDING">Pause at PENDING</option>
                  <option value="PROCESSING">Pause at PROCESSING</option>
                </select>
              </label>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    const response = await fetch('/api/payments/batch/advance', { method: 'POST' });
                    const data = await response.json();
                    if (data.success) {
                      fetchPayments();
                      alert(`Advanced ${data.updated} payment(s)`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Advance All Payments
                </button>
                <button
                  onClick={async () => {
                    const response = await fetch('/api/payments/batch/reset', { method: 'POST' });
                    const data = await response.json();
                    if (data.success) {
                      fetchPayments();
                      alert(`Reset ${data.reset} payment(s) to CREATED`);
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reset All to CREATED
                </button>
                <button
                  onClick={async () => {
                    const response = await fetch('/api/payments/batch/fail-random', { method: 'POST' });
                    const data = await response.json();
                    if (data.success) {
                      fetchPayments();
                      alert(`Failed payment: ${data.payment.uetr}`);
                    } else {
                      alert(data.message || 'No payments available to fail');
                    }
                  }}
                  className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Fail Random Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === filter
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {filter} ({filter === 'All' ? payments.length : payments.filter(p => p.status === filter).length})
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <p>No payments found</p>
            <a href="/compose" className="text-blue-500 hover:underline mt-2 inline-block">
              Create New Payment
            </a>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UETR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rail</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parties</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Controls</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      <span>{getStatusIcon(payment.status)}</span>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-gray-900">
                    {payment.uetr.substring(0, 15)}...
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">{payment.rail}</td>
                  <td className="px-4 py-4 text-sm">{payment.currency} {payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm">
                    <div>{payment.debtorName}</div>
                    <div className="text-gray-500">→ {payment.creditorName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {/* Status Control Buttons */}
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'reverse')}
                        disabled={payment.status === 'CREATED'}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Previous Status"
                      >
                        ◀️
                      </button>
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'advance')}
                        disabled={payment.status === 'COMPLETED' || payment.status === 'FAILED'}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Next Status"
                      >
                        ▶️
                      </button>
                      <button
                        onClick={() => updatePaymentStatus(payment.id, 'fail')}
                        disabled={payment.status === 'FAILED' || payment.status === 'COMPLETED'}
                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                        title="Fail Payment"
                      >
                        ⚠️
                      </button>
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        👁️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Payment Details</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedPayment.uetr}</p>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Manual Status Control for Selected Payment */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-3">Manual Status Control</h3>
                <div className="flex gap-2 flex-wrap">
                  {['CREATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        updatePaymentStatus(selectedPayment.id, 'manual', status);
                        setSelectedPayment({...selectedPayment, status});
                      }}
                      disabled={selectedPayment.status === status}
                      className={`px-3 py-1 rounded ${
                        selectedPayment.status === status
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border hover:bg-gray-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)} {selectedPayment.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-semibold">{selectedPayment.currency} {selectedPayment.amount.toFixed(2)}</p>
                </div>
              </div>

              {/* Event Timeline */}
              {selectedPayment.events && selectedPayment.events.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Event Timeline</h3>
                  <div className="space-y-3">
                    {selectedPayment.events
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                          }`}></div>
                          {index < selectedPayment.events!.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-200"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.type}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href="/compose"
        className="fixed bottom-6 right-6 bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </a>
    </div>
  );
}
