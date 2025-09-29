import { ValidationResult, ValidationError, ValidationWarning } from '../types';

export class ISO20022Validator {
  // Business rules for each rail
  private railRules = {
    FEDNOW: {
      maxAmount: 500000,
      requiredFields: ['debtorName', 'debtorAcct', 'creditorName', 'creditorAcct'],
      supportedCurrencies: ['USD'],
      addressRequired: true,
      maxRemittanceLength: 140
    },
    RTP: {
      maxAmount: 1000000,
      requiredFields: ['debtorName', 'debtorAcct', 'creditorName', 'creditorAcct'],
      supportedCurrencies: ['USD'],
      addressRequired: true,
      maxRemittanceLength: 140,
      supportsRfP: true
    },
    'CBPR+': {
      maxAmount: 999999999,
      requiredFields: ['debtorName', 'debtorAcct', 'creditorName', 'creditorAcct', 'uetr'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
      addressRequired: true,
      maxRemittanceLength: 9000,
      requiresUETR: true
    }
  };

  validatePayment(payment: any, rail: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const rules = this.railRules[rail as keyof typeof this.railRules];

    if (!rules) {
      errors.push({
        code: 'INVALID_RAIL',
        field: 'rail',
        message: `Unsupported payment rail: ${rail}`,
        severity: 'CRITICAL'
      });
      return { valid: false, errors, warnings };
    }
