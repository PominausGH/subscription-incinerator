export class BankImportError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean
  ) {
    super(message)
    this.name = 'BankImportError'
  }
}

export const ERRORS = {
  INVALID_FILE_TYPE: new BankImportError(
    'Invalid file type',
    'INVALID_FILE_TYPE',
    'Please upload a CSV file. Other formats (PDF, OFX) are not yet supported.',
    true
  ),
  FILE_TOO_LARGE: new BankImportError(
    'File exceeds size limit',
    'FILE_TOO_LARGE',
    'File must be under 5MB. Try exporting a shorter date range.',
    true
  ),
  EMPTY_FILE: new BankImportError(
    'Empty file',
    'EMPTY_FILE',
    'The uploaded file is empty. Please select a valid bank statement.',
    true
  ),
  NO_TRANSACTIONS: new BankImportError(
    'No transactions found',
    'NO_TRANSACTIONS',
    'No transactions found in this file. Please check the file contains transaction data.',
    true
  ),
  AI_PARSE_FAILED: new BankImportError(
    'AI parsing failed',
    'AI_PARSE_FAILED',
    "We had trouble understanding this format. Please try a different export option from your bank.",
    true
  ),
  INTERNAL_ERROR: new BankImportError(
    'Internal error',
    'INTERNAL_ERROR',
    'Something went wrong. Please try again.',
    true
  ),
}
