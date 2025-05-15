export interface PaymentInitializeResponse {
    authorization_url: string;
    access_code: string;
    reference: string;
  }
  
  export interface PaymentVerifyResponse {
    status: boolean;
    message: string;
    data: {
      amount: number;
      reference: string;
      status: 'success' | 'failed';
      metadata: any;
    };
  }
  
  export interface PaymentInitData {
    email: string;
    amount: number;
    reference?: string;
    metadata?: any;
  }
  
  export interface IPaymentProvider {
    initializePayment(data: PaymentInitData): Promise<PaymentInitializeResponse>;
    verifyPayment(reference: string): Promise<PaymentVerifyResponse>;
  }