import { create } from "zustand";

export type Toast = {
  id: string;
  emoji: string;
  message: string;
  href?: string | null;
};

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const toast: Toast = { id, ...t };
      window.setTimeout(() => {
        set((cur) => ({ toasts: cur.toasts.filter((x) => x.id !== id) }));
      }, 5000);
      return { toasts: [toast, ...s.toasts].slice(0, 4) };
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
