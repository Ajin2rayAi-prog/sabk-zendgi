import type { OrderStatus, PaymentStatus } from "@prisma/client";

// برچسب و رنگ وضعیت سفارش/پرداخت (مشترک بین حساب کاربری و پنل)

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "در انتظار تأیید",
  CONFIRMED: "تأییدشده",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
  CONFIRMED: "bg-sky-400/15 text-sky-600 dark:text-sky-400",
  SHIPPED: "bg-indigo-400/15 text-indigo-600 dark:text-indigo-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELED: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  UNPAID: "پرداخت‌نشده",
  PAID: "پرداخت‌شده",
  REFUNDED: "بازگشت‌داده‌شده",
};

export const ORDER_STATUS_VALUES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
];

export const PAYMENT_STATUS_VALUES: PaymentStatus[] = ["UNPAID", "PAID", "REFUNDED"];
