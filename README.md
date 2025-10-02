# ISO 20022 Payments Lab

A comprehensive web application for creating, validating, and tracking ISO 20022 payment messages across multiple payment rails (FedNow®, RTP®, and SWIFT CBPR+).

## Features

### Core Functionality
- **Payment Creation**: Intuitive form interface for composing ISO 20022 compliant payments
- **XML Generation**: Automatic generation of ISO 20022 messages:
  - pain.001 (Customer Credit Transfer Initiation)
  - pacs.008 (FI to FI Customer Credit Transfer)
  - pacs.002 (Payment Status Report)
  - camt.054 (Bank to Customer Debit/Credit Notification)
- **Multi-Rail Support**: FedNow, RTP, and SWIFT with rail-specific validation
- **Payment Tracking**: Real-time monitoring of payment lifecycle and status transitions
- **Validation**: Built-in limits and business rules per payment rail

### Testing & Development Features
- **Test Control Panel**: Advanced testing interface with:
  - Manual status progression controls
  - Configurable failure simulation
  - Speed controls (0.5x to 5x)
  - Bulk operations
- **Status Simulation**: CREATED → PENDING → PROCESSING → COMPLETED/FAILED
- **Rail-Specific Timing**: Different processing speeds for each payment rail

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **XML Processing**: fast-xml-parser, uuid
- **UI Components**: Custom React components

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/iso20022-payments-lab.git
cd iso20022-payments-lab
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
echo 'DATABASE_URL="file:./dev.db"' > .env
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
iso20022-payments-lab/
├── app/
│   ├── compose/page.tsx       # Payment creation form
│   ├── payments/page.tsx      # Payment tracking dashboard
│   ├── api/
│   │   └── payments/
│   │       ├── route.ts       # Payment CRUD operations
│   │       └── [id]/
│   │           └── status/route.ts  # Status management
│   └── layout.tsx             # Root layout
├── components/ui/             # Reusable UI components
├── lib/
│   ├── xml/generator.ts      # ISO 20022 XML generation
│   ├── prisma.ts             # Database client
│   └── utils.ts              # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

## Usage

### Creating a Payment

1. Navigate to `/compose`
2. Select payment rail (FedNow, RTP, or SWIFT)
3. Enter payment details:
   - Debtor information
   - Creditor information
   - Amount and currency
   - Purpose and remittance information
4. Click "Create Payment"
5. View generated XML messages

### Tracking Payments

1. Navigate to `/payments`
2. View all payments with real-time status updates
3. Use filters to sort by status
4. Click "View Details" for payment timeline
5. Use "Test Controls" for manual status management (development mode)

### Payment Rails & Limits

| Rail | Transaction Limit | Processing Speed | Availability |
|------|------------------|------------------|--------------|
| FedNow | $500,000 | < 20 seconds | 24/7/365 |
| RTP | $1,000,000 | < 15 seconds | 24/7/365 |
| SWIFT | $999,999,999.99 | 1-5 days | Business hours |

## Database Schema

### Payment Model
```prisma
model Payment {
  id              String    @id @default(cuid())
  uetr            String    @unique
  rail            String
  amount          Float
  currency        String
  debtorName      String
  debtorAccount   String
  creditorName    String
  creditorAccount String
  purpose         String?
  remittance      String?
  status          String    @default("CREATED")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  pain001Xml      String?
  pacs008Xml      String?
  events          Event[]
}
```

## API Endpoints

### Payment Management
- `GET /api/payments` - List all payments
- `POST /api/payments` - Create new payment
- `PUT /api/payments/[id]/status` - Update payment status

## Development Mode

The application includes a comprehensive test control panel for development:

1. Enable test controls at `/payments`
2. Configure:
   - Auto-progress speed
   - Failure simulation rate
   - Pause points in lifecycle
3. Use manual controls for individual payments
4. Bulk operations for multiple payments

## Production Deployment

### Before Deployment

1. Disable test mode in `/app/api/payments/route.ts`:
```javascript
const TEST_CONFIG = {
  enabled: false,  // Set to false for production
  // ...
}
```

2. Remove or protect test control panel
3. Set appropriate environment variables
4. Configure production database

### Environment Variables

```env
DATABASE_URL="file:./prod.db"  # Use appropriate production DB
NODE_ENV="production"
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ISO 20022 standard documentation
- FedNow Service specifications
- The Clearing House RTP network
- SWIFT CBPR+ documentation

## Support

For issues and questions, please open an issue on GitHub or contact the maintainers.

---

Built with love for the modern payments ecosystem

