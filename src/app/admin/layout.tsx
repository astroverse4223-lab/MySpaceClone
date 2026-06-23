import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { isStaff } from "@/lib/admin";

const NAV_SECTIONS: { title: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    title: "Insights",
    items: [{ href: "/admin", label: "Overview", icon: "📊" }],
  },
  {
    title: "Manage",
    items: [
      { href: "/admin/users", label: "Users", icon: "👥" },
      { href: "/admin/content", label: "Content", icon: "📝" },
      { href: "/admin/communities", label: "Communities", icon: "🏛️" },
      { href: "/admin/reports", label: "Reports", icon: "🚩" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: "💳" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/admin/broadcast", label: "Broadcast", icon: "📢" },
      { href: "/admin/audit-log", label: "Audit log", icon: "🧾" },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!isStaff(session)) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-6 py-10">
      <nav className="w-48 shrink-0 space-y-5">
        <div>
          <p className="px-3 text-lg font-semibold text-white">Admin</p>
          <p className="px-3 text-xs text-white/40">Control center</p>
        </div>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
