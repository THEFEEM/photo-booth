export type BookingStatus =
  | "pending_payment"
  | "pending_verify"
  | "waiting"
  | "called"
  | "shooting"
  | "done"
  | "no_show"
  | "cancelled";

export type PaymentMethod = "promptpay" | "cash";

export interface BookingStatusResponse {
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid";
  name: string;
  partySize: number;
  photoCount: number;
  amountThb: number;
  queueLabel: string | null;
  position: number | null;
  etaMinutes: number | null;
  promptpayQr: string | null;
  slipRejected: boolean;
}

export interface QueueState {
  shooting: string | null;
  called: string | null;
  upNext: string[];
  waitingCount: number;
}

export interface StaffBooking {
  id: string;
  queueLabel: string | null;
  name: string;
  partySize: number;
  photoCount: number;
  amountThb: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "unpaid" | "paid";
  status: BookingStatus;
  callCount: number;
  createdAt: string;
  slipUrl: string | null;
}

export interface StaffQueueResponse {
  active: StaffBooking[];
  recent: StaffBooking[];
  stats: { waiting: number; doneToday: number; revenuePaidThb: number };
}
