"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { resetAdminPassword } from "../../actions";

/** دیالوگ تعیین رمز عبور جدید برای یک مدیر (فقط مالک) */
export function ResetPasswordDialog({ username, id }: { username: string; id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-primary-soft hover:text-primary"
        title="تعیین رمز عبور جدید"
      >
        <KeyRound className="h-3.5 w-3.5" /> رمز
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold">
              تعیین رمز عبور جدید
              <span className="mr-1 text-sm font-normal text-muted" dir="ltr">
                (@{username})
              </span>
            </h3>
            <form action={resetAdminPassword} className="space-y-4">
              <input type="hidden" name="id" value={id} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold">رمز عبور جدید</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-2 text-xs text-muted">
                  پس از ذخیره، این کاربر باید با رمز جدید وارد شود.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center">
                  ذخیره رمز
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-elev"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
