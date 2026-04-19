export type UserData = {
  id?: number;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  creator_status?: 'none' | 'pending' | 'approved' | 'rejected';
  profile_picture?: string;
  // Frontend-only fields
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  gender?: string;
  age?: string;
  profilePicture?: string;
  headerImage?: string;
  themeColor?: string;
  language?: string;
  hasSeenTutorial?: boolean;
};

export type AuthState = {
  isAuthenticated: boolean;
  userType: 'admin' | 'user' | null;
  userData: UserData | null;
};

export type Product = {
  id: number | string;
  name: string;
  price: number | string;
  images: string[];
  image?: string; // Computed from images[0] for convenience
  description?: string;
  category?: string;
  categoryId?: number;
  userId?: number;
  creator?: string;
  creatorObj?: { id: number; name: string };
  rating?: number;
  review_count?: number;
  sold_count?: number;
  status?: string;
  features?: string[];
  tags?: string[];
  reviews?: number;
  sales?: number;
  format?: string;
  size?: string;
  license?: string;
};

export type CartItem = {
  id: string;
  name: string;
  image: string;
  creator: string;
  price: number;
  quantity: number;
};

// Conversation type matching backend
export type Conversation = {
  id: number;
  partnerId: number;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSenderId: number | null;
};

// Message type matching backend
export type ChatMessage = {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  type?: 'text' | 'purchase_request' | 'invoice';
  productId?: number;
  createdAt: string;
  sender?: { id: number; name: string };
  product_info?: {
    id: number;
    name: string;
    price: string | number;
    images: string[];
    image?: string;
  };
};
