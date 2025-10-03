import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ISO 20022 Payments Lab
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Generate compliant ISO 20022 payment messages for FedNow, RTP, and SWIFT rails.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/compose"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            Create Payment
          </Link>
          
          <Link
            href="/payments"
            className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
          >
            View All Payments
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Built with Next.js, Prisma, PostgreSQL, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
