import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Event, CartItem, Order, Profile, EventCategory, DeliveryAddress, LocationState } from "@/types";

export interface AppSettings {
  site_name?: string;
  support_email?: string;
  contact_phone?: string;
  footer_text?: string;
  commission_percent?: number;
  tax_rate?: number;
  currency?: string;
  auto_cancel_hours?: number;
  max_tickets_per_order?: number;
  default_booking_limit?: number;
  email_confirmations?: boolean;
  require_otp?: boolean;
  order_status_updates?: boolean;
  auto_publish_reviews?: boolean;
  review_approval_required?: boolean;
  logo_url?: string;
  favicon_url?: string;
  brand_color?: string;
  exchange_rates?: Record<string, number>;
}

interface AppState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  theme: "dark" | "light";
  cart: CartItem[];
  recentOrders: Order[];
  location: LocationState | null;
  showLocationPopup: boolean;
  settings: AppSettings;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setTheme: (theme: "dark" | "light") => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  addRecentOrder: (order: Order) => void;
  logout: () => void;
  setLocation: (loc: LocationState | null) => void;
  setShowLocationPopup: (show: boolean) => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setSettings: (settings: AppSettings) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      theme: "dark",
      cart: [],
      recentOrders: [],
      location: null,
      showLocationPopup: false,
      settings: {},

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setProfile: (profile) => set({ profile }),

      setTheme: (theme) => set({ theme }),

      addToCart: (item) => {
        const { cart } = get();
        const existingItem = cart.find(
          (i) => i.event_id === item.event_id && i.category_id === item.category_id
        );

        if (existingItem) {
          set({
            cart: cart.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ cart: [...cart, item] });
        }
      },

      removeFromCart: (itemId) =>
        set({ cart: get().cart.filter((item) => item.id !== itemId) }),

      updateCartQuantity: (itemId, quantity) =>
        set({
          cart: get().cart.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }),

      clearCart: () => set({ cart: [] }),

      addRecentOrder: (order) =>
        set({ recentOrders: [order, ...get().recentOrders.slice(0, 9)] }),

      setLocation: (loc) => set({ location: loc }),

      setShowLocationPopup: (show) => set({ showLocationPopup: show }),

      updateSetting: (key, value) =>
        set((state) => ({ settings: { ...state.settings, [key]: value } })),

      setSettings: (settings) => set({ settings }),

      logout: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          cart: [],
          recentOrders: [],
        }),
    }),
    {
      name: "event-pass-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        cart: state.cart,
        location: state.location,
        settings: state.settings,
      }),
    }
  )
);

interface CheckoutState {
  selectedEvent: Event | null;
  selectedCategory: EventCategory | null;
  quantity: number;
  paymentMethod: string | null;
  deliveryAddress: DeliveryAddress | null;
  phoneVerified: boolean;
  emailVerified: boolean;
  step: "selection" | "details" | "checkout" | "payment" | "approval" | "success";
  setSelectedEvent: (event: Event | null) => void;
  setSelectedCategory: (category: EventCategory | null) => void;
  setQuantity: (quantity: number) => void;
  setPaymentMethod: (method: string | null) => void;
  setDeliveryAddress: (addr: DeliveryAddress | null) => void;
  setPhoneVerified: (v: boolean) => void;
  setEmailVerified: (v: boolean) => void;
  setStep: (step: CheckoutState["step"]) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  selectedEvent: null,
  selectedCategory: null,
  quantity: 1,
  paymentMethod: null,
  deliveryAddress: null,
  phoneVerified: false,
  emailVerified: false,
  step: "selection",

  setSelectedEvent: (event) => set({ selectedEvent: event }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setQuantity: (quantity) => set({ quantity }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDeliveryAddress: (addr) => set({ deliveryAddress: addr }),
  setPhoneVerified: (v) => set({ phoneVerified: v }),
  setEmailVerified: (v) => set({ emailVerified: v }),
  setStep: (step) => set({ step }),
  reset: () =>
    set({
      selectedEvent: null,
      selectedCategory: null,
      quantity: 1,
      paymentMethod: null,
      deliveryAddress: null,
      phoneVerified: false,
      emailVerified: false,
      step: "selection",
    }),
}));
