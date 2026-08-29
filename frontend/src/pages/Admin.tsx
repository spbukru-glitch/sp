import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  LogOut,
  Pencil,
  Save,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

interface AdminLoginResponse { authenticated: boolean; message: string }
interface AdminOverview { total_bookings: number; new_bookings: number; service_count: number; pricing_count: number; content_sections: number }
type BookingStatus = "new" | "contacted" | "paid" | "completed" | "closed";
interface Booking { id: string; full_name: string; mobile: string; email: string; mode: string; slot: string; issue_description: string; document_name?: string | null; status: BookingStatus; created_at: string }
interface BookingStatusUpdate { status: BookingStatus }
interface PriceItem { id: string; name: string; fee: string; group: string; sort_order: number }
interface PriceItemUpdate { name: string; fee: string; group: string }
interface SiteContent { about: string; mission: string; vision: string; values: string; head_office: string; branch_office: string; phone: string; whatsapp: string; email: string; hours: string }
type SiteContentUpdate = SiteContent;

const priceGroups = ["Consultation", "Corporate", "Disputes", "Property", "Compliance", "Global", "Projects", "Employment", "Government", "Drafting", "Access"];
const bookingStatuses: BookingStatus[] = ["new", "contacted", "paid", "completed", "closed"];

export default function Admin() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PriceItemUpdate>({ name: "", fee: "", group: "Corporate" });
  const [contentDraft, setContentDraft] = useState<SiteContent | null>(null);

  const loginMutation = useMutation({
    mutationFn: () => apiPost<AdminLoginResponse>("/admin/login", { password }),
    onSuccess: (result) => { setAuthenticated(result.authenticated); setPassword(""); toast.success("Admin access granted"); },
    onError: () => toast.error("Incorrect password", { description: "Use the demo credential from the handoff." }),
  });
  const logoutMutation = useMutation({ mutationFn: () => apiPost<void>("/admin/logout"), onSuccess: () => { setAuthenticated(false); queryClient.clear(); } });
  const overviewQuery = useQuery({ queryKey: ["admin-overview"], queryFn: () => apiGet<AdminOverview>("/admin/overview"), enabled: authenticated, retry: false });
  const bookingsQuery = useQuery({ queryKey: ["admin-bookings"], queryFn: () => apiGet<Booking[]>("/admin/bookings"), enabled: authenticated, retry: false });
  const pricingQuery = useQuery({ queryKey: ["pricing"], queryFn: () => apiGet<PriceItem[]>("/pricing"), enabled: authenticated, retry: false });
  const contentQuery = useQuery({ queryKey: ["site-content"], queryFn: () => apiGet<SiteContent>("/content"), enabled: authenticated, retry: false });
  const priceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PriceItemUpdate }) => apiPatch<PriceItem>(`/admin/pricing/${id}`, payload),
    onSuccess: async () => {
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["pricing"] });
      toast.success("Pricing updated", { description: "The public catalogue and PDF now use the new details." });
    },
    onError: () => toast.error("Pricing could not be updated"),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => apiPatch<Booking>(`/admin/bookings/${id}/status`, { status } satisfies BookingStatusUpdate),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-overview"] }),
      ]);
      toast.success("Booking status updated");
    },
    onError: () => toast.error("Booking status could not be updated"),
  });
  const contentMutation = useMutation({
    mutationFn: (payload: SiteContentUpdate) => apiPatch<SiteContent>("/admin/content", payload),
    onSuccess: async () => {
      setContentDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Website content updated", { description: "The public website now uses the new content." });
    },
    onError: () => toast.error("Website content could not be updated"),
  });

  const startEditing = (item: PriceItem) => {
    setEditingId(item.id);
    setDraft({ name: item.name, fee: item.fee, group: item.group });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] px-5 py-8 text-white sm:px-8" data-testid="admin-login-page">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
          <a href="/" className="mb-14 flex items-center gap-3 text-xs uppercase tracking-[0.15em] text-slate-400 transition-colors hover:text-white" data-testid="admin-back-home-link"><ArrowLeft className="size-4" /> Back to public site</a>
          <div className="mb-10">
            <span className="flex size-12 items-center justify-center border border-[#d7a652] font-heading text-xl text-[#d7a652]" data-testid="admin-login-monogram">SP</span>
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-[#d7a652]" data-testid="admin-login-eyebrow">Operations desk</p>
            <h1 className="mt-3 font-heading text-5xl" data-testid="admin-login-title">Welcome back.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-400" data-testid="admin-login-description">Secure access to booking requests and service operations.</p>
          </div>
          <form className="border-t border-white/15 pt-7" onSubmit={(event) => { event.preventDefault(); loginMutation.mutate(); }} data-testid="admin-login-form">
            <label htmlFor="admin-password" className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400" data-testid="admin-password-label">Admin password</label>
            <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-13 rounded-none border-white/20 bg-white/5 pl-10 text-white placeholder:text-slate-600" placeholder="Enter password" required data-testid="admin-password-input" /></div>
            <Button type="submit" disabled={loginMutation.isPending} className="mt-5 h-13 w-full rounded-none bg-[#b45309] text-xs uppercase tracking-[0.16em] text-white hover:bg-[#d97706]" data-testid="admin-login-submit-button">{loginMutation.isPending ? "Verifying..." : "Enter admin desk"}<ArrowUpRight className="ml-2 size-4" /></Button>
          </form>
          <p className="mt-6 text-xs text-slate-500" data-testid="admin-login-security-note">Demo environment · Session protected by an httpOnly cookie.</p>
        </div>
      </div>
    );
  }

  const overview = overviewQuery.data;
  const bookings = bookingsQuery.data ?? [];
  const prices = pricingQuery.data ?? [];
  const stats = [
    [CalendarDays, "Total bookings", overview?.total_bookings ?? "—"],
    [Clock3, "New requests", overview?.new_bookings ?? "—"],
    [BriefcaseBusiness, "Service areas", overview?.service_count ?? "—"],
    [BarChart3, "Price points", overview?.pricing_count ?? "—"],
    [FileText, "Content sections", overview?.content_sections ?? "—"],
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]" data-testid="admin-dashboard-page">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <a href="/" className="flex items-center gap-3" data-testid="admin-header-brand-link"><span className="flex size-9 items-center justify-center border border-[#b45309] font-heading text-sm">SP</span><span><strong className="block font-heading text-lg">SpLegalMart</strong><span className="block text-[9px] uppercase tracking-[0.16em] text-slate-400">Operations desk</span></span></a>
          <div className="flex items-center gap-4"><span className="hidden text-xs uppercase tracking-[0.14em] text-slate-400 sm:block" data-testid="admin-session-status">Authenticated admin</span><button type="button" onClick={() => logoutMutation.mutate()} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-[#b45309]" data-testid="admin-logout-button"><LogOut className="size-4" /> Sign out</button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.18em] text-[#b45309]" data-testid="admin-dashboard-eyebrow">Live overview</p><h1 className="mt-3 font-heading text-4xl sm:text-5xl" data-testid="admin-dashboard-title">The legal desk.</h1><p className="mt-3 text-sm text-slate-500" data-testid="admin-dashboard-subtitle">Bookings, services and content at a glance.</p></div><a href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500 hover:text-[#b45309]" data-testid="admin-view-site-link">View public site <ArrowUpRight className="size-4" /></a></div>
        <div className="mt-8 grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(([Icon, label, value], index) => <div className="bg-white p-5" key={label} data-testid={`admin-stat-${index + 1}`}><Icon className="size-5 text-[#b45309]" /><p className="mt-5 text-xs uppercase tracking-[0.12em] text-slate-400" data-testid={`admin-stat-label-${index + 1}`}>{label}</p><p className="mt-1 font-heading text-3xl" data-testid={`admin-stat-value-${index + 1}`}>{value}</p></div>)}
        </div>

        <section className="mt-12 border border-slate-200 bg-white" data-testid="admin-bookings-section">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center"><div><p className="text-xs uppercase tracking-[0.16em] text-[#b45309]" data-testid="admin-bookings-eyebrow">Incoming work</p><h2 className="mt-2 font-heading text-3xl" data-testid="admin-bookings-title">Consultation requests</h2></div><span className="inline-flex items-center gap-2 text-xs text-slate-500" data-testid="admin-bookings-count"><Users className="size-4 text-[#b45309]" /> {bookings.length} records</span></div>
          {bookingsQuery.isLoading ? <p className="p-8 text-sm text-slate-500" data-testid="admin-bookings-loading">Loading requests...</p> : bookings.length === 0 ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto size-8 text-[#b45309]" /><p className="mt-4 font-heading text-2xl" data-testid="admin-bookings-empty-title">No requests yet</p><p className="mt-2 text-sm text-slate-500" data-testid="admin-bookings-empty-copy">New consultation bookings will appear here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left" data-testid="admin-bookings-table"><thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-6 py-4" data-testid="admin-bookings-client-heading">Client</th><th className="px-6 py-4" data-testid="admin-bookings-mode-heading">Mode / slot</th><th className="px-6 py-4" data-testid="admin-bookings-issue-heading">Issue</th><th className="px-6 py-4" data-testid="admin-bookings-status-heading">Status</th></tr></thead><tbody>{bookings.map((booking) => <tr className="border-t border-slate-100 align-top" key={booking.id} data-testid={`admin-booking-row-${booking.id}`}><td className="px-6 py-5"><p className="font-medium" data-testid={`admin-booking-client-${booking.id}`}>{booking.full_name}</p><p className="mt-1 text-xs text-slate-400" data-testid={`admin-booking-contact-${booking.id}`}>{booking.mobile} · {booking.email}</p></td><td className="px-6 py-5 text-sm text-slate-600"><p data-testid={`admin-booking-mode-${booking.id}`}>{booking.mode}</p><p className="mt-1 text-xs text-slate-400" data-testid={`admin-booking-slot-${booking.id}`}>{booking.slot}</p></td><td className="max-w-sm px-6 py-5 text-sm leading-6 text-slate-600" data-testid={`admin-booking-issue-${booking.id}`}>{booking.issue_description}</td><td className="px-6 py-5"><select value={booking.status} onChange={(event) => statusMutation.mutate({ id: booking.id, status: event.target.value as BookingStatus })} className="h-9 border border-slate-300 bg-white px-3 text-xs font-medium uppercase tracking-[0.08em] text-[#92400e]" aria-label={`Update status for ${booking.full_name}`} data-testid={`admin-booking-status-select-${booking.id}`}>{bookingStatuses.map((statusValue) => <option value={statusValue} key={statusValue}>{statusValue}</option>)}</select></td></tr>)}</tbody></table></div>}
        </section>

        <section className="mt-12 border border-slate-200 bg-white" data-testid="admin-pricing-section">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center"><div><p className="text-xs uppercase tracking-[0.16em] text-[#b45309]" data-testid="admin-pricing-eyebrow">Catalogue controls</p><h2 className="mt-2 font-heading text-3xl" data-testid="admin-pricing-title">Pricing editor</h2><p className="mt-2 text-sm text-slate-500" data-testid="admin-pricing-description">Updates appear on the public website and in the downloadable PDF.</p></div><span className="text-xs text-slate-500" data-testid="admin-pricing-count">{prices.length} entries</span></div>
          {pricingQuery.isLoading ? <p className="p-8 text-sm text-slate-500" data-testid="admin-pricing-loading">Loading catalogue...</p> : <div className="max-h-[720px] overflow-auto"><table className="w-full min-w-[900px] text-left" data-testid="admin-pricing-table"><thead className="sticky top-0 bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-slate-400"><tr><th className="px-6 py-4">Service</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Fee</th><th className="px-6 py-4 text-right">Action</th></tr></thead><tbody>{prices.map((item) => <tr className="border-t border-slate-100 align-middle" key={item.id} data-testid={`admin-pricing-row-${item.id}`}>{editingId === item.id ? <><td className="px-6 py-3"><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="rounded-none" data-testid={`admin-pricing-name-input-${item.id}`} /></td><td className="px-6 py-3"><select value={draft.group} onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))} className="h-9 w-full border border-slate-300 bg-white px-3 text-sm" data-testid={`admin-pricing-group-select-${item.id}`}>{priceGroups.map((group) => <option key={group}>{group}</option>)}</select></td><td className="px-6 py-3"><Input value={draft.fee} onChange={(event) => setDraft((current) => ({ ...current, fee: event.target.value }))} className="rounded-none" data-testid={`admin-pricing-fee-input-${item.id}`} /></td><td className="px-6 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => priceMutation.mutate({ id: item.id, payload: draft })} disabled={priceMutation.isPending} className="inline-flex size-9 items-center justify-center bg-[#b45309] text-white hover:bg-[#92400e]" aria-label={`Save ${item.name}`} data-testid={`admin-pricing-save-${item.id}`}><Save className="size-4" /></button><button type="button" onClick={() => setEditingId(null)} className="inline-flex size-9 items-center justify-center border border-slate-300 text-slate-500 hover:text-[#0f172a]" aria-label={`Cancel editing ${item.name}`} data-testid={`admin-pricing-cancel-${item.id}`}><X className="size-4" /></button></div></td></> : <><td className="px-6 py-4 text-sm text-slate-700" data-testid={`admin-pricing-name-${item.id}`}>{item.name}</td><td className="px-6 py-4 text-xs uppercase tracking-[0.1em] text-slate-400" data-testid={`admin-pricing-group-${item.id}`}>{item.group}</td><td className="px-6 py-4 font-heading text-lg text-[#92400e]" data-testid={`admin-pricing-fee-${item.id}`}>{item.fee}</td><td className="px-6 py-4 text-right"><button type="button" onClick={() => startEditing(item)} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-[#b45309]" data-testid={`admin-pricing-edit-${item.id}`}><Pencil className="size-3.5" /> Edit</button></td></>}</tr>)}</tbody></table></div>}
        </section>

        <section className="mt-12 border border-slate-200 bg-white" data-testid="admin-content-section">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
            <div><p className="text-xs uppercase tracking-[0.16em] text-[#b45309]" data-testid="admin-content-eyebrow">Public website</p><h2 className="mt-2 font-heading text-3xl" data-testid="admin-content-title">Content editor</h2><p className="mt-2 text-sm text-slate-500" data-testid="admin-content-description">Manage About, mission, vision, values, offices, and contact details.</p></div>
            {!contentDraft && <button type="button" onClick={() => contentQuery.data && setContentDraft({ ...contentQuery.data })} disabled={!contentQuery.data} className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#92400e] transition-colors hover:text-[#b45309] disabled:text-slate-300" data-testid="admin-content-edit-button"><Pencil className="size-4" /> Edit content</button>}
          </div>
          {contentQuery.isLoading ? <p className="p-8 text-sm text-slate-500" data-testid="admin-content-loading">Loading website content...</p> : contentDraft ? <form onSubmit={(event) => { event.preventDefault(); contentMutation.mutate(contentDraft); }} className="grid gap-6 p-6 lg:grid-cols-2" data-testid="admin-content-form">
            <div className="lg:col-span-2"><label htmlFor="content-about" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-about-label">About</label><Textarea id="content-about" value={contentDraft.about} onChange={(event) => setContentDraft((current) => current ? { ...current, about: event.target.value } : current)} className="min-h-28 rounded-none" data-testid="admin-content-about-input" /></div>
            <div><label htmlFor="content-mission" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-mission-label">Mission</label><Textarea id="content-mission" value={contentDraft.mission} onChange={(event) => setContentDraft((current) => current ? { ...current, mission: event.target.value } : current)} className="min-h-28 rounded-none" data-testid="admin-content-mission-input" /></div>
            <div><label htmlFor="content-vision" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-vision-label">Vision</label><Textarea id="content-vision" value={contentDraft.vision} onChange={(event) => setContentDraft((current) => current ? { ...current, vision: event.target.value } : current)} className="min-h-28 rounded-none" data-testid="admin-content-vision-input" /></div>
            <div className="lg:col-span-2"><label htmlFor="content-values" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-values-label">Values</label><Textarea id="content-values" value={contentDraft.values} onChange={(event) => setContentDraft((current) => current ? { ...current, values: event.target.value } : current)} className="min-h-24 rounded-none" data-testid="admin-content-values-input" /></div>
            <div><label htmlFor="content-head-office" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-head-office-label">Head office</label><Textarea id="content-head-office" value={contentDraft.head_office} onChange={(event) => setContentDraft((current) => current ? { ...current, head_office: event.target.value } : current)} className="min-h-20 rounded-none" data-testid="admin-content-head-office-input" /></div>
            <div><label htmlFor="content-branch-office" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-branch-office-label">Branch office</label><Textarea id="content-branch-office" value={contentDraft.branch_office} onChange={(event) => setContentDraft((current) => current ? { ...current, branch_office: event.target.value } : current)} className="min-h-20 rounded-none" data-testid="admin-content-branch-office-input" /></div>
            <div><label htmlFor="content-phone" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-phone-label">Phone</label><Input id="content-phone" value={contentDraft.phone} onChange={(event) => setContentDraft((current) => current ? { ...current, phone: event.target.value } : current)} className="rounded-none" data-testid="admin-content-phone-input" /></div>
            <div><label htmlFor="content-whatsapp" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-whatsapp-label">WhatsApp</label><Input id="content-whatsapp" value={contentDraft.whatsapp} onChange={(event) => setContentDraft((current) => current ? { ...current, whatsapp: event.target.value } : current)} className="rounded-none" data-testid="admin-content-whatsapp-input" /></div>
            <div><label htmlFor="content-email" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-email-label">Email</label><Input id="content-email" type="email" value={contentDraft.email} onChange={(event) => setContentDraft((current) => current ? { ...current, email: event.target.value } : current)} className="rounded-none" data-testid="admin-content-email-input" /></div>
            <div><label htmlFor="content-hours" className="mb-2 block text-xs uppercase tracking-[0.12em] text-slate-500" data-testid="admin-content-hours-label">Operating hours</label><Input id="content-hours" value={contentDraft.hours} onChange={(event) => setContentDraft((current) => current ? { ...current, hours: event.target.value } : current)} className="rounded-none" data-testid="admin-content-hours-input" /></div>
            <div className="flex gap-3 lg:col-span-2"><Button type="submit" disabled={contentMutation.isPending} className="rounded-none bg-[#b45309] text-white hover:bg-[#92400e]" data-testid="admin-content-save-button"><Save className="mr-2 size-4" />{contentMutation.isPending ? "Saving..." : "Save content"}</Button><Button type="button" variant="outline" onClick={() => setContentDraft(null)} className="rounded-none" data-testid="admin-content-cancel-button">Cancel</Button></div>
          </form> : contentQuery.data ? <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-content-preview"><div className="bg-white p-6"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">About</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600" data-testid="admin-content-about-preview">{contentQuery.data.about}</p></div><div className="bg-white p-6"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Mission</p><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600" data-testid="admin-content-mission-preview">{contentQuery.data.mission}</p></div><div className="bg-white p-6"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Contact</p><p className="mt-3 text-sm leading-6 text-slate-600" data-testid="admin-content-contact-preview">{contentQuery.data.phone}<br />{contentQuery.data.email}</p></div><div className="bg-white p-6"><p className="text-xs uppercase tracking-[0.12em] text-slate-400">Hours</p><p className="mt-3 text-sm leading-6 text-slate-600" data-testid="admin-content-hours-preview">{contentQuery.data.hours}</p></div></div> : null}
        </section>
      </main>
    </div>
  );
}