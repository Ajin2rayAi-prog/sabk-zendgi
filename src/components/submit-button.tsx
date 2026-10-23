"use client";

import { useFormStatus } from "react-dom";

/** دکمهٔ ذخیره با حالت «در حال ذخیره…» — تا کاربر نفهمد گیر کرده */
export function SubmitButton({
  children,
  pendingLabel = "در حال ذخیره…",
  className,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className ?? "btn-primary"}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
