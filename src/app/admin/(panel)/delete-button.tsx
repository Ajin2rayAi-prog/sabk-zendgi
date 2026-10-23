"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

type ServerAction = (formData: FormData) => void | Promise<void>;

/** دکمهٔ حذف با پنجرهٔ تأیید (حذف / انصراف) — قبل از ارسال فرم می‌پرسد. */
export function DeleteButton({
  action,
  id,
  extra,
  message,
  title,
  className,
  formClassName,
  children,
}: {
  action: ServerAction;
  id: string;
  extra?: Record<string, string>;
  message: string;
  title?: string;
  className?: string;
  formClassName?: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} className={formClassName}>
      <input type="hidden" name="id" value={id} />
      {extra &&
        Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button
        title={title ?? "حذف"}
        onClick={(e) => {
          if (!window.confirm(message)) e.preventDefault();
        }}
        className={
          className ??
          "grid h-8 w-8 place-items-center rounded-lg border text-rose-500 hover:border-rose-400 hover:bg-rose-500/10"
        }
      >
        {children ?? <Trash2 className="h-4 w-4" />}
      </button>
    </form>
  );
}

/** دکمهٔ submit تأییدی داخل فرمِ موجود (مثل حذف دسته با formAction) */
export function ConfirmSubmitButton({
  action,
  message,
  title,
  disabled,
  className,
  children,
}: {
  action: ServerAction;
  message: string;
  title?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      formAction={action}
      title={title}
      disabled={disabled}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
