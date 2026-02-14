
export type UserStatus = 
  | 'unverified' 
  | 'verified' 
  | 'assessment_complete' 
  | 'payment_pending' 
  | 'under_review' 
  | 'approved' 
  | 'declined';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  verificationStatus: UserStatus;
  declaredLimit?: number;
  eligibleLimit?: number;
  monthlyIncome?: number;
  businessType?: string;
  yearsInBusiness?: number;
  creditScore?: number;
  aiReport?: string;
  createdAt: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  limit: number;
  fee: number;
  description: string;
  recommended?: boolean;
}

export interface Application {
  id: string;
  userId: string;
  selectedPackage: string;
  requestedLimit: number;
  serviceFee: number;
  transactionId?: string;
  checkoutRequestID?: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  applicationStatus: UserStatus;
  reviewDate?: number;
  createdAt: number;
}