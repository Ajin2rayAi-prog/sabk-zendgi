"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateAdmin } from "../../actions";
import type { AdminUser } from "@prisma/client";

/** دیالوگ ویرایش نام نمایشی، نام کاربری و نقش یک مدیر (فقط مالک) */
export function UserEditDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-primary-soft hover:text-primary"
      >
        <Pencil className="h-3.5 w-3.5" /> ویرایش
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
            <h3 className="mb-4 text-lg font-bold">ویرایش کاربر: {user.name}</h3>
            <form action={updateAdmin} className="space-y-4">
              <input type="hidden" name="id" value={user.id} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold">نام نمایشی</label>
                <input
                  name="name"
                  required
                  defaultValue={user.name}
                  className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">نام کاربری</label>
                <input
                  name="username"
                  required
                  dir="ltr"
                  defaultValue={user.username}
                  className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">نقش</label>
                <select
                  name="role"
                  defaultValue={user.role}
                  className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="MANAGER">مدیر (محتوا/محصول/سفارش)</option>
                  <option value="OWNER">مالک (دسترسی کامل)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 justify-center">
                  ذخیره
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
