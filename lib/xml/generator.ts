import { v4 as uuidv4 } from 'uuid';

// Types for payment data
export interface PaymentData {
  paymentId: string;
  amount: number;
  currency: string;
  debtorName: string;
  debtorAccountId: string;
  creditorName: string;
  creditorAccountId: string;
  paymentRail: 'FEDNOW' | 'RTP' | 'SWIFT';
  remittanceInfo?: string;
  timestamp?: string;
}

// Validation rules for each payment rail
export class PaymentValidator {
  static validate(data: PaymentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.debtorName || !data.debtorAccountId) {
      errors.push('Debtor information is required');
    }

    if (!data.creditorName || !data.creditorAccountId) {
      errors.push('Creditor information is required');
    }

    // Rail-specific validation
    switch (data.paymentRail) {
      case 'FEDNOW':
        if (data.amount > 500000) {
          errors.push('FedNow payment limit is $500,000');
        }
        break;
      case 'RTP':
        if (data.amount > 1000000) {
          errors.push('RTP payment limit is $1,000,000');
        }
        break;
      case 'SWIFT':
        if (data.amount > 999999999.99) {
          errors.push('SWIFT payment limit is $999,999,999.99');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Main XML Generator Class
export class ISO20022Generator {
  private static formatDateTime(date: Date = new Date()): string {
    return date.toISOString().split('.')[0];
  }

  private static formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  // Generate pain.001 (Customer Credit Transfer Initiation)
  static generatePain001(data: PaymentData): string {
    const msgId = `MSG-${uuidv4()}`;
    const pmtInfId = `PMT-${uuidv4()}`;
    const instrId = data.paymentId || `INSTR-${uuidv4()}`;
    const endToEndId = `E2E-${uuidv4()}`;
    const timestamp = data.timestamp || this.formatDateTime();

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${this.formatAmount(data.amount)}</CtrlSum>
      <InitgPty>
        <Nm>${data.debtorName}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${this.formatAmount(data.amount)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>${this.getServiceLevelCode(data.paymentRail)}</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${timestamp.split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>${data.debtorName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <Othr>
            <Id>${data.debtorAccountId}</Id>
          </Othr>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${this.getBICCode(data.paymentRail)}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <CdtTrfTxInf>
        <PmtId>
          <InstrId>${instrId}</InstrId>
          <EndToEndId>${endToEndId}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${data.currency || 'USD'}">${this.formatAmount(data.amount)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${this.getBICCode(data.paymentRail)}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${data.creditorName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <Othr>
              <Id>${data.creditorAccountId}</Id>
            </Othr>
          </Id>
        </CdtrAcct>
        ${data.remittanceInfo ? `
        <RmtInf>
          <Ustrd>${data.remittanceInfo}</Ustrd>
        </RmtInf>` : ''}
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
  }

  // Generate pacs.008 (FI to FI Customer Credit Transfer)
  static generatePacs008(data: PaymentData): string {
    const msgId = `PACS-${uuidv4()}`;
    const txId = data.paymentId || `TX-${uuidv4()}`;
    const endToEndId = `E2E-${uuidv4()}`;
    const timestamp = data.timestamp || this.formatDateTime();

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.02">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="${data.currency || 'USD'}">${this.formatAmount(data.amount)}</TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>${timestamp.split('T')[0]}</IntrBkSttlmDt>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <TxId>${txId}</TxId>
        <EndToEndId>${endToEndId}</EndToEndId>
        <ClrSysRef>${this.getPaymentSystemReference(data.paymentRail)}</ClrSysRef>
      </PmtId>
      <PmtTpInf>
        <SvcLvl>
          <Cd>${this.getServiceLevelCode(data.paymentRail)}</Cd>
        </SvcLvl>
      </PmtTpInf>
      <IntrBkSttlmAmt Ccy="${data.currency || 'USD'}">${this.formatAmount(data.amount)}</IntrBkSttlmAmt>
      <ChrgBr>SLEV</ChrgBr>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${this.getBICCode(data.paymentRail)}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <Dbtr>
        <Nm>${data.debtorName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <Othr>
            <Id>${data.debtorAccountId}</Id>
          </Othr>
        </Id>
      </DbtrAcct>
      <CdtrAgt>
        <FinInstnId>
          <BIC>${this.getBICCode(data.paymentRail)}</BIC>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>${data.creditorName}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <Othr>
            <Id>${data.creditorAccountId}</Id>
          </Othr>
        </Id>
      </CdtrAcct>
      ${data.remittanceInfo ? `
      <RmtInf>
        <Ustrd>${data.remittanceInfo}</Ustrd>
      </RmtInf>` : ''}
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
  }

  // Generate pacs.002 (Payment Status Report)
  static generatePacs002(data: PaymentData, status: 'ACCP' | 'RJCT' = 'ACCP'): string {
    const msgId = `PACS002-${uuidv4()}`;
    const orgnlMsgId = `MSG-${uuidv4()}`;
    const timestamp = data.timestamp || this.formatDateTime();

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.03">
  <FIToFIPmtStsRpt>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>${orgnlMsgId}</OrgnlMsgId>
      <OrgnlMsgNmId>pacs.008.001.02</OrgnlMsgNmId>
      <OrgnlCreDtTm>${timestamp}</OrgnlCreDtTm>
      <GrpSts>${status}</GrpSts>
      ${status === 'RJCT' ? `
      <StsRsnInf>
        <Rsn>
          <Cd>AC01</Cd>
        </Rsn>
      </StsRsnInf>` : ''}
    </OrgnlGrpInfAndSts>
    <TxInfAndSts>
      <OrgnlInstrId>${data.paymentId || uuidv4()}</OrgnlInstrId>
      <OrgnlEndToEndId>E2E-${uuidv4()}</OrgnlEndToEndId>
      <TxSts>${status}</TxSts>
      ${status === 'RJCT' ? `
      <StsRsnInf>
        <Rsn>
          <Cd>AC01</Cd>
        </Rsn>
      </StsRsnInf>` : ''}
      <OrgnlTxRef>
        <Amt>
          <InstdAmt Ccy="${data.currency || 'USD'}">${this.formatAmount(data.amount)}</InstdAmt>
        </Amt>
        <Dbtr>
          <Nm>${data.debtorName}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <Othr>
              <Id>${data.debtorAccountId}</Id>
            </Othr>
          </Id>
        </DbtrAcct>
        <Cdtr>
          <Nm>${data.creditorName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <Othr>
              <Id>${data.creditorAccountId}</Id>
            </Othr>
          </Id>
        </CdtrAcct>
      </OrgnlTxRef>
    </TxInfAndSts>
  </FIToFIPmtStsRpt>
</Document>`;
  }

  // Generate camt.054 (Bank to Customer Debit/Credit Notification)
  static generateCamt054(data: PaymentData): string {
    const msgId = `CAMT054-${uuidv4()}`;
    const ntfctnId = `NTFCTN-${uuidv4()}`;
    const timestamp = data.timestamp || this.formatDateTime();

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.02">
  <BkToCstmrDbtCdtNtfctn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${timestamp}</CreDtTm>
    </GrpHdr>
    <Ntfctn>
      <Id>${ntfctnId}</Id>
      <CreDtTm>${timestamp}</CreDtTm>
      <Acct>
        <Id>
          <Othr>
            <Id>${data.debtorAccountId}</Id>
          </Othr>
        </Id>
        <Ownr>
          <Nm>${data.debtorName}</Nm>
        </Ownr>
      </Acct>
      <Ntry>
        <Amt Ccy="${data.currency || 'USD'}">${this.formatAmount(data.amount)}</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt>
          <Dt>${timestamp.split('T')[0]}</Dt>
        </BookgDt>
        <ValDt>
          <Dt>${timestamp.split('T')[0]}</Dt>
        </ValDt>
        <NtryDtls>
          <TxDtls>
            <Refs>
              <EndToEndId>E2E-${uuidv4()}</EndToEndId>
            </Refs>
            <Amt Ccy="${data.currency || 'USD'}">${this.formatAmount(data.amount)}</Amt>
            <CdtDbtInd>DBIT</CdtDbtInd>
            <RltdPties>
              <Dbtr>
                <Nm>${data.debtorName}</Nm>
              </Dbtr>
              <DbtrAcct>
                <Id>
                  <Othr>
                    <Id>${data.debtorAccountId}</Id>
                  </Othr>
                </Id>
              </DbtrAcct>
              <Cdtr>
                <Nm>${data.creditorName}</Nm>
              </Cdtr>
              <CdtrAcct>
                <Id>
                  <Othr>
                    <Id>${data.creditorAccountId}</Id>
                  </Othr>
                </Id>
              </CdtrAcct>
            </RltdPties>
            ${data.remittanceInfo ? `
            <RmtInf>
              <Ustrd>${data.remittanceInfo}</Ustrd>
            </RmtInf>` : ''}
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`;
  }

  // Helper methods
  private static getServiceLevelCode(rail: string): string {
    switch (rail) {
      case 'FEDNOW':
        return 'URGP';
      case 'RTP':
        return 'URGP';
      case 'SWIFT':
        return 'G001';
      default:
        return 'SEPA';
    }
  }

  private static getBICCode(rail: string): string {
    switch (rail) {
      case 'FEDNOW':
        return 'FEDNUSXXFNS';
      case 'RTP':
        return 'RTPNUSXXXXX';
      case 'SWIFT':
        return 'SWFTUSXXXXX';
      default:
        return 'XXXXUSXXXXX';
    }
  }

  private static getPaymentSystemReference(rail: string): string {
    switch (rail) {
      case 'FEDNOW':
        return 'FEDNOW';
      case 'RTP':
        return 'TCH-RTP';
      case 'SWIFT':
        return 'SWIFT-CBPR';
      default:
        return 'SYSTEM';
    }
  }

  // Generate all message types for a payment
  static generateAllMessages(data: PaymentData): {
    pain001: string;
    pacs008: string;
    pacs002: string;
    camt054: string;
  } {
    return {
      pain001: this.generatePain001(data),
      pacs008: this.generatePacs008(data),
      pacs002: this.generatePacs002(data, 'ACCP'),
      camt054: this.generateCamt054(data)
    };
  }
}

// Export both classes
export { ISO20022Generator as default };
