export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  artist_name: string;
  venue: string;
  venue_address: string;
  date: string;
  time: string;
  image_url: string;
  thumbnail_url: string;
  venue_plan?: string;
  is_sold_out: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_live: boolean;
  total_tickets: number;
  sold_tickets: number;
  users_attending?: number;
  created_at: string;
  updated_at: string;
  categories?: EventCategory[];
}

export interface EventCategory {
  id: string;
  event_id: string;
  name: string;
  price: number;
  total_seats: number;
  available_seats: number;
  description?: string;
  color?: string;
}

export interface Order {
  id: string;
  user_id: string;
  event_id: string;
  status: "pending" | "accepted" | "rejected" | "auto_rejected" | "paid" | "completed";
  total_amount: number;
  payment_method?: string;
  payment_id?: string;
  created_at: string;
  updated_at: string;
  event?: Event;
  user?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  category_id: string;
  quantity: number;
  price: number;
  category?: EventCategory;
}

export interface CartItem {
  id: string;
  event_id: string;
  category_id: string;
  quantity: number;
  event?: Event;
  category?: EventCategory;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "order" | "payment" | "system";
  is_read: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: "upi" | "card" | "netbanking" | "wallet";
  icon: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalEvents: number;
  totalUsers: number;
  ordersTrend: number;
  revenueTrend: number;
  eventsTrend: number;
  usersTrend: number;
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface DeliveryAddress {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  label: "home" | "work" | "other";
  phone_verified?: boolean;
  email_verified?: boolean;
}

export interface LocationState {
  state: string;
  city: string;
  display: string;
}

export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const MUMBAI_CITIES = [
  "Andheri", "Bandra", "Borivali", "Colaba", "Dadar", "Goregaon",
  "Juhu", "Khar", "Malad", "Marine Lines", "Mira Road", "Navi Mumbai",
  "Powai", "Santacruz", "Thane", "Vashi", "Versova", "Vile Parle",
];