export type PaymentRail = 'FEDNOW' | 'RTP' | 'CBPR+';

export type PaymentStatus = 
  | 'ACSP' // Accepted Settlement in Process
  | 'ACTC' // Accepted Technical Validation
  | 'ACCP' // Accepted Customer Profile
  | 'ACSC' // Accepted Settlement Completed
  | 'RJCT' // Rejected
  | 'PDNG' // Pending

export interface PaymentRequest {
  rail: PaymentRail;
  debtorName: string;
  debtorAcct: string;
  debtorBic?: string;
  creditorName: string;
  creditorAcct: string;
  creditorBic?: string;
  amount: number;
  currency: string;
  purpose?: string;
  remittance?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'ERROR' | 'CRITICAL';
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
}
