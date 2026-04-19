export type OrderStatus = 'pending' | 'waiting_verification' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  Product?: {
    id: number;
    name: string;
    images: string[];
    price: string | number;
  };
};

export type Order = {
  id: number;
  total_price: number;
  shipping_cost: number;
  shipping_address?: string;
  tracking_number?: string;
  status: OrderStatus;
  payment_proof?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type ReturnStatus = 'Pending' | 'In Review' | 'Approved' | 'Processing' | 'Completed' | 'Rejected';

export type ReturnRecord = {
  returnId: string;
  orderId: string;
  productName: string;
  productImage: string;
  returnReason: string;
  returnType: 'refund' | 'replacement';
  returnStatus: ReturnStatus;
  requestedDate: string;
  completedDate?: string;
  refundAmount?: number;
  videoEvidence: string;
  photoEvidence: string[];
  rejectionReason?: string;
  adminNotes?: string;
  customerName: string;
  customerEmail: string;
  creatorName: string;
};

export type UploadedFile = {
  id: string;
  file: File;
  preview: string;
  progress: number;
};
