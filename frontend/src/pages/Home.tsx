import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Globe2,
  Gavel,
  Handshake,
  Landmark,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  Target,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api";

interface Booking {
  id: string;
  full_name: string;
  mobile: string;
  email: string;
  mode: string;
  slot: string;
  issue_description: string;
  document_name?: string | null;
  status: string;
  created_at: string;
}

interface BookingPayload {
  full_name: string;
  mobile: string;
  email: string;
  mode: "Online video / audio call" | "Office visit" | "Door-to-door service";
  slot: string;
  issue_description: string;
  document_name?: string;
}

interface PricingItem { name: string; fee: string; group: string }

const expertise = [
  { icon: Gavel, title: "Dispute Resolution", body: "Litigation management, arbitration, mediation, civil and criminal disputes." },
  { icon: Building2, title: "Corporate & Commercial", body: "Entity formation, governance, M&A, contracts and cross-border structuring." },
  { icon: Landmark, title: "Property & Projects", body: "Land acquisition, registration, vetting, EPC and project compliance." },
  { icon: ShieldCheck, title: "Compliance & Risk", body: "Corporate audit, regulatory approvals, AML, GST, EPF, ESI and tax support." },
  { icon: Users, title: "Employment & Mobility", body: "Workforce contracts, domestic enquiries, labour compliance and disputes." },
  { icon: Globe2, title: "Global Legal Support", body: "International dispute resolution, IP protection and multi-jurisdictional advice." },
];

const pricing: PricingItem[] = [
  { name: "Initial online consultation (10 min)", fee: "₹199", group: "Consultation" },
  { name: "Detailed online consultation (30 min)", fee: "₹499", group: "Consultation" },
  { name: "Detailed online consultation (1 hour)", fee: "₹999", group: "Consultation" },
  { name: "Office / offline consultation (1 hour)", fee: "₹999", group: "Consultation" },
  { name: "Drafting / vetting up to 3 pages", fee: "₹999", group: "Drafting" },
  { name: "Drafting / vetting over 3–10 pages", fee: "₹4,999", group: "Drafting" },
  { name: "Drafting / vetting over 10 pages", fee: "₹9,999", group: "Drafting" },
  { name: "Complete case management (annually)", fee: "₹9,999", group: "Disputes" },
  { name: "Complete case management (one time)", fee: "₹49,999", group: "Disputes" },
  { name: "Corporate retainer (monthly)", fee: "₹4,999", group: "Corporate" },
  { name: "Corporate legal audit (one time)", fee: "₹9,999", group: "Corporate" },
  { name: "Property document vetting up to 5 pages", fee: "₹999", group: "Property" },
  { name: "Property document vetting over 5 pages", fee: "₹4,999", group: "Property" },
  { name: "Government representation & liaisoning (annual)", fee: "₹9,999", group: "Government" },
  { name: "EPC / JV / MOU commercial contracts", fee: "0.5% of project cost", group: "Projects" },
  { name: "EPC project compliance monitoring", fee: "1% of project cost", group: "Projects" },
  { name: "Employment & service disputes (annual)", fee: "₹9,999", group: "Employment" },
  { name: "Employment & service disputes (one time)", fee: "₹49,999", group: "Employment" },
  { name: "International dispute resolution", fee: "1% of cost involved", group: "Global" },
  { name: "IP protection (annual)", fee: "₹9,999", group: "Global" },
  { name: "Corporate legal training", fee: "₹4,999", group: "Corporate" },
  { name: "Arbitration & mediation (annual)", fee: "₹9,999", group: "Disputes" },
  { name: "Arbitration & mediation (one time)", fee: "₹49,999", group: "Disputes" },
  { name: "Domestic enquiry services", fee: "₹9,999", group: "Employment" },
  { name: "Custom / GST / income tax / EPF / ESI filing", fee: "₹499 per filing", group: "Compliance" },
  { name: "Corporate legal audit & risk analysis", fee: "₹9,999", group: "Compliance" },
  { name: "Investigation & fact-finding services", fee: "₹9,999", group: "Compliance" },
  { name: "Regulatory & environmental approvals", fee: "₹4,999 monthly", group: "Compliance" },
  { name: "Criminal / family / property / civil matters (annual)", fee: "₹9,999", group: "Disputes" },
  { name: "Criminal / family / property / civil matters (one time)", fee: "₹49,999", group: "Disputes" },
  { name: "Factory establishment & labour compliance", fee: "1% of project cost", group: "Projects" },
  { name: "Land verification, acquisition & registration", fee: "0.5% of cost", group: "Property" },
  { name: "Company registration & MCA compliance", fee: "₹1,999", group: "Corporate" },
  { name: "Court representation — district / High Court / tribunals", fee: "₹999", group: "Government" },
  { name: "Government tender & contract assistance", fee: "0.5% of cost", group: "Government" },
  { name: "Door-to-door service / per visit", fee: "₹999 + travel", group: "Access" },
];

const navItems = [
  ["About", "about"], ["Expertise", "expertise"], ["Pricing", "pricing"], ["How it works", "process"], ["Contact", "contact"],
];

const PHONEPE_QR_URL = "https://customer-assets-0z36b82j.emergentagent.net/job_legal-one-roof/artifacts/l7dh0l55_qr.html.png";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#top" className="group flex items-center gap-3" data-testid={light ? "footer-logo-link" : "header-logo-link"}>
      <span className={`flex size-10 items-center justify-center border ${light ? "border-[#c8943e] text-[#d7a652]" : "border-[#b45309] text-[#0f172a]"} font-heading text-lg`} data-testid="logo-monogram">SP</span>
      <span className="leading-none" data-testid="logo-wordmark">
        <span className={`block font-heading text-xl tracking-tight ${light ? "text-white" : "text-[#0f172a]"}`}>SpLegalMart</span>
        <span className={`mt-1 block text-[9px] font-medium uppercase tracking-[0.22em] ${light ? "text-slate-400" : "text-slate-500"}`}>Global Legal Services</span>
      </span>
    </a>
  );
}

function SectionLabel({ children, light = false, testId }: { children: string; light?: boolean; testId: string }) {
  return <p className={`mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] ${light ? "text-[#d7a652]" : "text-[#b45309]"}`} data-testid={testId}><span className="h-px w-8 bg-current" />{children}</p>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [priceSearch, setPriceSearch] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [form, setForm] = useState<BookingPayload>({ full_name: "", mobile: "", email: "", mode: "Online video / audio call", slot: "", issue_description: "" });

  const bookingMutation = useMutation({
    mutationFn: (payload: BookingPayload) => apiPost<Booking>("/bookings", payload),
    onSuccess: () => {
      toast.success("Consultation request received", { description: "Our legal desk will contact you shortly." });
      setForm({ full_name: "", mobile: "", email: "", mode: "Online video / audio call", slot: "", issue_description: "" });
      setDocumentName("");
    },
    onError: () => toast.error("We could not send your request", { description: "Please call or WhatsApp us directly." }),
  });

  const filteredPricing = pricing.filter((item) => item.name.toLowerCase().includes(priceSearch.toLowerCase()) || item.group.toLowerCase().includes(priceSearch.toLowerCase()));
  const updateField = (field: keyof BookingPayload, value: string) => setForm((current) => ({ ...current, [field]: value } as BookingPayload));
  const submitBooking = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); bookingMutation.mutate({ ...form, document_name: documentName || undefined }); };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8fafc] text-[#0f172a]" id="top">
      <div className="bg-[#0f172a] px-5 py-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300" data-testid="top-service-ribbon">Round-the-clock legal support <span className="mx-3 text-[#d7a652]">/</span> India + international matters <span className="mx-3 text-[#d7a652]">/</span> Delivery within 24 hours</div>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl" data-testid="site-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation" data-testid="desktop-navigation">
            {navItems.map(([label, href]) => <a className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600 transition-colors hover:text-[#b45309]" href={`#${href}`} key={href} data-testid={`nav-link-${href}`}>{label}</a>)}
          </nav>
          <div className="hidden items-center gap-5 lg:flex">
            <a href="tel:+917992461191" className="flex items-center gap-2 text-xs font-medium text-slate-600 transition-colors hover:text-[#b45309]" data-testid="header-phone-link"><Phone className="size-3.5" />+91 79924 61191</a>
            <a href="#booking" className="group inline-flex items-center gap-2 bg-[#b45309] px-4 py-3 text-xs font-medium uppercase tracking-[0.13em] text-white transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:bg-[#92400e] hover:shadow-lg" data-testid="header-book-consultation-button">Book consultation <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
          </div>
          <button type="button" className="inline-flex size-10 items-center justify-center border border-slate-200 lg:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation" data-testid="mobile-navigation-toggle">{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
        {mobileOpen && <nav className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden" aria-label="Mobile navigation" data-testid="mobile-navigation">{navItems.map(([label, href]) => <a className="block border-b border-slate-100 py-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-600" href={`#${href}`} key={href} onClick={() => setMobileOpen(false)} data-testid={`mobile-nav-link-${href}`}>{label}</a>)}<a href="#booking" className="mt-4 block bg-[#b45309] px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.13em] text-white" onClick={() => setMobileOpen(false)} data-testid="mobile-book-consultation-button">Book consultation</a></nav>}
      </header>

      <main>
        <section className="noise-dark relative min-h-[720px] overflow-hidden bg-[#020617]" aria-labelledby="hero-title" data-testid="hero-section">
          <img className="absolute inset-0 size-full object-cover opacity-45" src="https://images.unsplash.com/photo-1784059211920-c1a246b5e025?crop=entropy&cs=srgb&fm=jpg&q=80&w=2200" alt="Modern glass office towers representing global business" data-testid="hero-background-image" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/80 to-[#0f172a]/30" />
          <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-end gap-10 px-5 pb-20 pt-24 lg:grid-cols-12 lg:px-8 lg:pb-28">
            <div className="animate-fade-up lg:col-span-8" data-testid="hero-copy">
              <SectionLabel light testId="hero-eyebrow">A global platform for legal solutions</SectionLabel>
              <h1 id="hero-title" className="max-w-4xl font-heading text-5xl leading-[.98] tracking-tight text-white sm:text-6xl lg:text-8xl" data-testid="hero-title">Trusted legal solutions.<br /><em className="font-normal text-[#d7a652]">Anytime. Anywhere.</em></h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-slate-300 sm:text-lg" data-testid="hero-description">Justice, professionalism, and client trust are the foundations of everything we do. Expert legal guidance across borders — under one roof.</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a href="#booking" className="group inline-flex items-center gap-3 bg-[#b45309] px-6 py-4 text-xs font-medium uppercase tracking-[0.16em] text-white transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-1 hover:bg-[#d97706] hover:shadow-xl" data-testid="hero-book-consultation-button">Book a consultation <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></a>
                <a href="#expertise" className="group inline-flex items-center gap-2 px-3 py-4 text-xs font-medium uppercase tracking-[0.16em] text-white transition-colors hover:text-[#d7a652]" data-testid="hero-explore-services-link">Explore services <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></a>
              </div>
            </div>
            <div className="hidden border-l border-white/25 pl-8 lg:col-span-4 lg:col-start-9 lg:block" data-testid="hero-proof-panel">
              <p className="font-heading text-4xl text-white" data-testid="hero-proof-stat">24<span className="text-[#d7a652]">/7</span></p>
              <p className="mt-2 text-sm leading-6 text-slate-300" data-testid="hero-proof-copy">Availability online and offline, with an accountable legal team ready to move when you are.</p>
              <div className="mt-8 h-px w-full bg-white/20" /><p className="mt-5 text-xs uppercase tracking-[0.2em] text-[#d7a652]" data-testid="hero-refund-guarantee">100% fee refund guarantee on delayed delivery</p>
            </div>
          </div>
        </section>

        <div className="overflow-hidden border-b border-[#eadfc9] bg-[#f5efe5] py-4" data-testid="expertise-ribbon"><div className="animate-ribbon flex w-max items-center gap-16 whitespace-nowrap font-heading text-lg text-[#6b4d2d]"><span>Litigation</span><span>Arbitration</span><span>Corporate Law</span><span>Compliance</span><span>Intellectual Property</span><span>Cross-Border Counsel</span><span>Litigation</span><span>Arbitration</span><span>Corporate Law</span><span>Compliance</span><span>Intellectual Property</span><span>Cross-Border Counsel</span></div></div>

        <section id="about" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" data-testid="about-section">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5"><SectionLabel testId="about-eyebrow">Who we are</SectionLabel><h2 className="font-heading text-4xl leading-tight tracking-tight sm:text-5xl" data-testid="about-title">A steadier way through complex legal matters.</h2><p className="mt-7 text-base leading-8 text-slate-600" data-testid="about-description">SpLegalMart is a premier international legal consultancy and service integration platform. Every legal matter is unique; we understand the circumstances, identify the right strategy, and work diligently toward a successful outcome.</p><p className="mt-5 text-base leading-8 text-slate-600" data-testid="about-description-secondary">We combine legal expertise, thorough research, strategic planning, and professional dedication to bridge complex multi-jurisdictional needs with efficient business operations.</p><a href="#booking" className="mt-8 inline-flex items-center gap-2 border-b border-[#b45309] pb-2 text-xs font-medium uppercase tracking-[0.15em] text-[#92400e] transition-[gap] hover:gap-4" data-testid="about-book-link">Speak with our legal desk <ArrowUpRight className="size-4" /></a></div>
            <div className="relative lg:col-span-6 lg:col-start-7"><div className="absolute -left-6 -top-6 hidden size-28 border-l border-t border-[#b45309]/40 lg:block" /><img className="relative h-[380px] w-full object-cover sm:h-[500px]" src="https://images.unsplash.com/photo-1758518731462-d091b0b4ed0d?crop=entropy&cs=srgb&fm=jpg&q=80&w=1400" alt="Professionals reviewing a contract together" data-testid="about-image" /><div className="absolute -bottom-8 left-6 max-w-xs bg-[#0f172a] p-6 text-white sm:left-10" data-testid="about-callout"><p className="font-heading text-2xl leading-tight" data-testid="about-callout-title">One roof.<br /><span className="text-[#d7a652]">Many answers.</span></p><p className="mt-3 text-xs leading-5 text-slate-300" data-testid="about-callout-copy">Practical, timely, and result-oriented assistance at every stage.</p></div></div>
          </div>
        </section>

        <section id="expertise" className="bg-[#eef2f6] px-5 py-24 lg:px-8 lg:py-32" data-testid="expertise-section"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><SectionLabel testId="expertise-eyebrow">Our core expertise</SectionLabel><h2 className="max-w-2xl font-heading text-4xl leading-tight sm:text-5xl" data-testid="expertise-title">Legal counsel that moves with the real world.</h2></div><p className="max-w-sm text-sm leading-7 text-slate-600" data-testid="expertise-description">From individual rights to multinational operations, our service integration model keeps every moving part visible and accountable.</p></div><div className="mt-14 grid gap-px bg-slate-300 md:grid-cols-2 lg:grid-cols-3">{expertise.map(({ icon: Icon, title, body }, index) => <article className="group bg-[#eef2f6] p-7 transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-white lg:p-9" key={title} data-testid={`expertise-card-${index + 1}`}><Icon className="size-8 stroke-[1.25] text-[#b45309] transition-transform duration-300 group-hover:-translate-y-1" /><h3 className="mt-9 font-heading text-2xl" data-testid={`expertise-card-title-${index + 1}`}>{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600" data-testid={`expertise-card-description-${index + 1}`}>{body}</p><a href="#booking" className="mt-7 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#92400e]" data-testid={`expertise-card-link-${index + 1}`}>Discuss this area <ArrowUpRight className="size-3.5" /></a></article>)}</div></div></section>

        <section id="pricing" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" data-testid="pricing-section"><div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><SectionLabel testId="pricing-eyebrow">Transparent & fair</SectionLabel><h2 className="font-heading text-4xl leading-tight sm:text-5xl" data-testid="pricing-title">A clear starting point<br />for every matter.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-slate-600" data-testid="pricing-description">No hidden charges. Travelling and court miscellaneous expenses are extra. Every engagement begins with clarity.</p></div><div className="w-full max-w-sm"><label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500" htmlFor="pricing-search" data-testid="pricing-search-label">Find a service</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="pricing-search" value={priceSearch} onChange={(event) => setPriceSearch(event.target.value)} placeholder="Search consultation, audit..." className="h-12 rounded-none border-slate-300 bg-white pl-10" data-testid="pricing-search-input" /></div></div></div><div className="mt-12 overflow-hidden border border-slate-200 bg-white" data-testid="pricing-table"><div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-[#0f172a] px-5 py-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-300 sm:grid-cols-[1fr_180px_140px]"><span data-testid="pricing-table-service-heading">Service</span><span className="hidden sm:block" data-testid="pricing-table-category-heading">Category</span><span className="text-right" data-testid="pricing-table-fee-heading">Fee</span></div><div className="max-h-[620px] overflow-y-auto">{filteredPricing.map((item, index) => <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 px-5 py-4 transition-colors hover:bg-[#fffaf2] sm:grid-cols-[1fr_180px_140px]" key={`${item.name}-${index}`} data-testid={`pricing-row-${index + 1}`}><span className="text-sm leading-6 text-slate-700" data-testid={`pricing-service-${index + 1}`}>{item.name}</span><span className="hidden text-xs uppercase tracking-[0.12em] text-slate-400 sm:block" data-testid={`pricing-category-${index + 1}`}>{item.group}</span><span className="text-right font-heading text-lg text-[#92400e]" data-testid={`pricing-fee-${index + 1}`}>{item.fee}</span></div>)}{filteredPricing.length === 0 && <p className="p-8 text-center text-sm text-slate-500" data-testid="pricing-empty-state">No matching services. Try another search term.</p>}</div></div></section>

        <section className="noise-dark bg-[#0f172a] px-5 py-24 text-white lg:px-8 lg:py-28" data-testid="mission-section"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12 lg:gap-20"><div className="lg:col-span-5"><SectionLabel light testId="mission-eyebrow">Our purpose</SectionLabel><h2 className="font-heading text-4xl leading-tight sm:text-5xl" data-testid="mission-title">Simplify the difficult. Protect what matters.</h2><p className="mt-7 text-base leading-8 text-slate-300" data-testid="mission-copy">Our mission is to provide accessible, affordable, and professional legal solutions globally — protecting interests, resolving challenges, and making confident legal action possible regardless of location.</p></div><div className="grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:border-t-0 lg:pt-0"><article data-testid="mission-card"><Target className="size-6 text-[#d7a652]" /><h3 className="mt-5 font-heading text-2xl" data-testid="mission-card-title">Mission</h3><p className="mt-3 text-sm leading-6 text-slate-400" data-testid="mission-card-copy">Timely, practical, result-oriented assistance for every client.</p></article><article data-testid="vision-card"><Globe2 className="size-6 text-[#d7a652]" /><h3 className="mt-5 font-heading text-2xl" data-testid="vision-card-title">Vision</h3><p className="mt-3 text-sm leading-6 text-slate-400" data-testid="vision-card-copy">Ethical, innovative and exceptional legal service on a national and international scale.</p></article><article data-testid="values-card"><Handshake className="size-6 text-[#d7a652]" /><h3 className="mt-5 font-heading text-2xl" data-testid="values-card-title">Values</h3><p className="mt-3 text-sm leading-6 text-slate-400" data-testid="values-card-copy">Integrity, excellence, confidentiality, accountability and a client-first approach.</p></article></div></div></section>

        <section id="booking" className="bg-[#f5efe5] px-5 py-24 lg:px-8 lg:py-32" data-testid="booking-section"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12 lg:gap-20"><div className="lg:col-span-5"><SectionLabel testId="booking-eyebrow">Schedule instantly</SectionLabel><h2 className="font-heading text-4xl leading-tight sm:text-5xl" data-testid="booking-title">Tell us where you need a steady hand.</h2><p className="mt-6 max-w-md text-base leading-8 text-slate-600" data-testid="booking-description">Choose how you want to meet. Share the essentials. Our legal desk will get back to you with the next best step.</p><div className="mt-10 space-y-5">{[[Clock3, "24/7 online legal support", "A responsive legal desk, whenever the matter moves."], [Zap, "Delivery within 24 hours", "A clear commitment on the work we accept."], [BadgeCheck, "100% fee refund guarantee", "If an accepted delivery is delayed, your fee is refunded."]].map(([Icon, title, copy], index) => { const ItemIcon = Icon as typeof Clock3; return <div className="flex gap-4" key={String(title)} data-testid={`booking-benefit-${index + 1}`}><ItemIcon className="mt-1 size-5 shrink-0 text-[#b45309]" /><div><h3 className="text-sm font-medium" data-testid={`booking-benefit-title-${index + 1}`}>{title as string}</h3><p className="mt-1 text-sm leading-6 text-slate-500" data-testid={`booking-benefit-copy-${index + 1}`}>{copy as string}</p></div></div>; })}</div><div className="mt-12 border-l-2 border-[#b45309] pl-5" data-testid="payment-guidance-panel"><p className="text-xs uppercase tracking-[0.17em] text-slate-500" data-testid="payment-note-label">Payment guidance</p><p className="mt-2 font-heading text-2xl text-[#0f172a]" data-testid="payment-upi">UPI: 7992461191@ybl</p><p className="mt-2 text-sm text-slate-500" data-testid="payment-note">Scan the PhonePe QR after your consultation slot is confirmed. No hidden charges.</p><a href={PHONEPE_QR_URL} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-4 border border-[#d8c8ac] bg-white p-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg" aria-label="Open PhonePe payment QR code" data-testid="payment-qr-link"><img src={PHONEPE_QR_URL} alt="PhonePe payment QR code for SpLegalMart" className="size-32 object-contain" data-testid="payment-qr-image" /><span className="max-w-[130px] text-xs leading-5 text-slate-500">Open QR in a new tab<br /><span className="mt-1 inline-block font-medium text-[#92400e]">PhonePe payment</span></span></a></div></div><div className="bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,.08)] sm:p-10 lg:col-span-6 lg:col-start-7" data-testid="booking-form-panel"><div className="mb-8 flex items-start justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.16em] text-slate-400" data-testid="booking-form-kicker">Start a conversation</p><h3 className="mt-2 font-heading text-3xl" data-testid="booking-form-title">Book a consultation</h3></div><CalendarDays className="size-7 text-[#b45309]" /></div><form onSubmit={submitBooking} className="space-y-5" aria-label="Book a legal consultation" data-testid="booking-form"><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="full-name" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="full-name-label">Full name</label><Input id="full-name" required value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} className="h-12 rounded-none border-slate-300" data-testid="booking-full-name-input" /></div><div><label htmlFor="mobile" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="mobile-label">Mobile number</label><Input id="mobile" required value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} className="h-12 rounded-none border-slate-300" data-testid="booking-mobile-input" /></div></div><div><label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="email-label">Email address</label><Input id="email" type="email" required value={form.email} onChange={(event) => updateField("email", event.target.value)} className="h-12 rounded-none border-slate-300" data-testid="booking-email-input" /></div><div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="mode" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="mode-label">Preferred mode</label><select id="mode" value={form.mode} onChange={(event) => updateField("mode", event.target.value)} className="h-12 w-full rounded-none border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#b45309]" data-testid="booking-mode-select"><option>Online video / audio call</option><option>Office visit</option><option>Door-to-door service</option></select></div><div><label htmlFor="slot" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="slot-label">Preferred time slot</label><Input id="slot" required placeholder="e.g. Tue, 4:00 PM" value={form.slot} onChange={(event) => updateField("slot", event.target.value)} className="h-12 rounded-none border-slate-300" data-testid="booking-slot-input" /></div></div><div><label htmlFor="issue" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="issue-label">Brief legal issue</label><Textarea id="issue" required minLength={10} value={form.issue_description} onChange={(event) => updateField("issue_description", event.target.value)} placeholder="A few lines help us route your matter well." className="min-h-28 resize-y rounded-none border-slate-300" data-testid="booking-issue-textarea" /></div><div><label htmlFor="document" className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500" data-testid="document-label">Attach a document reference <span className="normal-case tracking-normal text-slate-400">(optional)</span></label><Input id="document" type="file" onChange={(event) => setDocumentName(event.target.files?.[0]?.name ?? "")} className="h-12 rounded-none border-slate-300 pt-3 text-xs" data-testid="booking-document-input" />{documentName && <p className="mt-2 text-xs text-slate-500" data-testid="booking-document-name">Selected: {documentName}</p>}</div><Button type="submit" disabled={bookingMutation.isPending} className="h-13 w-full rounded-none bg-[#b45309] text-xs font-medium uppercase tracking-[0.16em] text-white hover:bg-[#92400e]" data-testid="booking-submit-button">{bookingMutation.isPending ? "Sending request..." : "Send consultation request"}<ArrowUpRight className="ml-2 size-4" /></Button><p className="text-center text-xs leading-5 text-slate-400" data-testid="booking-privacy-note">Your information is treated with strict confidentiality and used only to respond to your request.</p></form></div></div></section>

        <section id="process" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" data-testid="process-section"><div className="grid gap-12 lg:grid-cols-4"><div className="lg:col-span-1"><SectionLabel testId="process-eyebrow">The process</SectionLabel><h2 className="font-heading text-4xl leading-tight" data-testid="process-title">Clarity at every stage.</h2></div><div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">{[["01", "Book", "Pay and schedule via phone, WhatsApp, or email."], ["02", "Share", "Provide basic details and relevant documents."], ["03", "Consult", "Meet online, at our office, or at your location."], ["04", "Strategy", "Receive a customized legal roadmap."], ["05", "Execute", "Drafting, representation, compliance, or resolution."], ["06", "Support", "Get updates and post-resolution assistance."]].map(([number, title, body]) => <article key={number} className="border-t border-slate-300 pt-5" data-testid={`process-step-${number}`}><p className="font-heading text-3xl text-[#b45309]" data-testid={`process-number-${number}`}>{number}</p><h3 className="mt-5 text-sm font-medium uppercase tracking-[0.14em]" data-testid={`process-title-${number}`}>{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500" data-testid={`process-description-${number}`}>{body}</p></article>)}</div></div></section>

        <section className="bg-white px-5 py-24 lg:px-8 lg:py-32" data-testid="testimonials-section"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-6"><div><SectionLabel testId="testimonials-eyebrow">Client perspective</SectionLabel><h2 className="font-heading text-4xl sm:text-5xl" data-testid="testimonials-title">Trust is earned in the details.</h2></div><span className="hidden text-xs uppercase tracking-[0.14em] text-slate-400 sm:block" data-testid="testimonials-note">Selected client feedback</span></div><div className="mt-14 grid gap-6 md:grid-cols-3">{[["https://images.pexels.com/photos/9623645/pexels-photo-9623645.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "A. Mehta", "Founder, New Delhi", "The team translated a complex commercial issue into a clear, executable plan. That clarity made all the difference."], ["https://images.pexels.com/photos/27086922/pexels-photo-27086922.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "Priya S.", "Operations lead, Bengaluru", "Responsive, practical, and transparent from the first conversation. We always knew what happened next."], ["https://images.unsplash.com/photo-1573497161161-c3e73707e25c?crop=entropy&cs=srgb&fm=jpg&q=80&w=700", "R. Khanna", "Investor, Ranchi", "Their property document review gave us confidence to make a major decision without guesswork."]].map(([image, name, role, quote], index) => <article className="border border-slate-200 p-6 sm:p-8" key={name} data-testid={`testimonial-card-${index + 1}`}><div className="flex items-center gap-4"><img className="size-14 rounded-full object-cover grayscale" src={image} alt={`${name}, client testimonial`} data-testid={`testimonial-image-${index + 1}`} /><div><p className="text-sm font-medium" data-testid={`testimonial-name-${index + 1}`}>{name}</p><p className="mt-1 text-xs text-slate-400" data-testid={`testimonial-role-${index + 1}`}>{role}</p></div></div><p className="mt-7 font-heading text-xl leading-8 text-[#334155]" data-testid={`testimonial-quote-${index + 1}`}>“{quote}”</p></article>)}</div></div></section>

        <section className="bg-[#eef2f6] px-5 py-24 lg:px-8 lg:py-28" data-testid="resources-section"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><SectionLabel testId="resources-eyebrow">Legal knowledge center</SectionLabel><h2 className="font-heading text-4xl" data-testid="resources-title">Useful context for the road ahead.</h2></div><a href="mailto:splegalmart@gmail.com?subject=Legal Knowledge Center" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#92400e]" data-testid="resources-email-link">Request a topic <ArrowUpRight className="size-4" /></a></div><div className="mt-12 grid gap-px bg-slate-300 sm:grid-cols-2 lg:grid-cols-4">{[[BookOpen, "Civil suits", "The first moves, documents, and timelines."], [FileText, "Legal notices", "When a notice helps, and how to respond."], [CircleDollarSign, "GST compliance", "Practical checks for growing businesses."], [Scale, "Human rights", "Know the protections available to you."]].map(([Icon, title, body], index) => { const ResourceIcon = Icon as typeof BookOpen; return <a href="mailto:splegalmart@gmail.com" className="group bg-[#eef2f6] p-7 transition-[background-color,transform] duration-300 hover:-translate-y-1 hover:bg-white" key={String(title)} data-testid={`resource-card-${index + 1}`}><ResourceIcon className="size-6 text-[#b45309]" /><h3 className="mt-8 font-heading text-2xl" data-testid={`resource-title-${index + 1}`}>{title as string}</h3><p className="mt-3 text-sm leading-6 text-slate-500" data-testid={`resource-description-${index + 1}`}>{body as string}</p><ChevronRight className="mt-6 size-4 text-[#b45309] transition-transform group-hover:translate-x-1" /></a>; })}</div></div></section>

        <section className="mx-auto grid max-w-7xl gap-16 px-5 py-24 lg:grid-cols-12 lg:px-8 lg:py-32" data-testid="csr-careers-section"><div className="lg:col-span-6"><SectionLabel testId="csr-eyebrow">Justice beyond the courtroom</SectionLabel><h2 className="font-heading text-4xl leading-tight sm:text-5xl" data-testid="csr-title">Good legal work should make room for good citizenship.</h2><div className="mt-10 space-y-5">{[[Leaf, "Free legal aid camps", "Rural legal assistance for underserved communities."], [BookOpen, "Legal literacy programs", "Workshops in schools and colleges on fundamental rights."], [Globe2, "Save life, save tree", "Promoting sustainability and green legal practices."]].map(([Icon, title, body], index) => { const CsrIcon = Icon as typeof Leaf; return <div className="flex gap-4 border-t border-slate-200 pt-5" key={String(title)} data-testid={`csr-item-${index + 1}`}><CsrIcon className="mt-1 size-5 text-[#b45309]" /><div><h3 className="text-sm font-medium" data-testid={`csr-item-title-${index + 1}`}>{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-500" data-testid={`csr-item-copy-${index + 1}`}>{body as string}</p></div></div>; })}</div></div><div className="border-t border-[#b45309] pt-7 lg:col-span-4 lg:col-start-9"><SectionLabel testId="careers-eyebrow">Join our team</SectionLabel><h2 className="font-heading text-3xl" data-testid="careers-title">Bring your perspective to the table.</h2><p className="mt-5 text-sm leading-7 text-slate-600" data-testid="careers-copy">We are looking for advocates, consultants, legal interns, legal tech and operations talent, and freelance legal managers.</p><a href="mailto:splegalmart@gmail.com?subject=Career application" className="mt-7 inline-flex items-center gap-2 border-b border-[#b45309] pb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#92400e]" data-testid="careers-email-link">Send your CV <ArrowUpRight className="size-4" /></a><p className="mt-5 text-sm text-slate-500" data-testid="careers-email">splegalmart@gmail.com</p></div></section>

        <section id="contact" className="bg-[#f5efe5] px-5 py-20 lg:px-8" data-testid="contact-section"><div className="mx-auto max-w-7xl"><div className="grid gap-10 md:grid-cols-3"><div><SectionLabel testId="contact-eyebrow">Get in touch</SectionLabel><h2 className="font-heading text-4xl" data-testid="contact-title">Your rights.<br /><span className="text-[#b45309]">Our responsibility.</span></h2></div><div className="space-y-5 text-sm text-slate-600"><div className="flex gap-3" data-testid="head-office-address"><MapPin className="size-5 shrink-0 text-[#b45309]" /><p><strong className="font-medium text-[#0f172a]">Head office</strong><br />Bawana, Delhi – 110040, India</p></div><div className="flex gap-3" data-testid="branch-office-address"><MapPin className="size-5 shrink-0 text-[#b45309]" /><p><strong className="font-medium text-[#0f172a]">Branch office</strong><br />Bukru, Kanke, Ranchi, Jharkhand – 834006</p></div></div><div className="space-y-4 text-sm text-slate-600"><a href="tel:+917992461191" className="flex items-center gap-3 transition-colors hover:text-[#b45309]" data-testid="contact-phone-link"><Phone className="size-5 text-[#b45309]" />+91 7992461191 / 9650323162</a><a href="mailto:splegalmart@gmail.com" className="flex items-center gap-3 transition-colors hover:text-[#b45309]" data-testid="contact-email-link"><Mail className="size-5 text-[#b45309]" />splegalmart@gmail.com</a><p className="flex items-center gap-3" data-testid="contact-hours"><Clock3 className="size-5 text-[#b45309]" />24/7 — round the clock</p></div></div></div></section>
      </main>

      <footer className="noise-dark bg-[#020617] px-5 py-20 text-white lg:px-8 lg:py-24" data-testid="site-footer"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-12 border-b border-white/15 pb-16 lg:flex-row"><div><Logo light /><p className="mt-8 max-w-xs text-sm leading-7 text-slate-400" data-testid="footer-description">Global legal solutions for individuals, families, businesses, organizations and institutions.</p></div><div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3"><div><p className="text-xs uppercase tracking-[0.17em] text-[#d7a652]" data-testid="footer-links-label">Explore</p><div className="mt-5 space-y-3">{navItems.slice(0, 4).map(([label, href]) => <a href={`#${href}`} className="block text-sm text-slate-400 transition-colors hover:text-white" key={href} data-testid={`footer-link-${href}`}>{label}</a>)}</div></div><div><p className="text-xs uppercase tracking-[0.17em] text-[#d7a652]" data-testid="footer-contact-label">Contact</p><div className="mt-5 space-y-3"><a href="https://wa.me/917992461191" className="block text-sm text-slate-400 hover:text-white" data-testid="footer-whatsapp-link">WhatsApp desk</a><a href="mailto:splegalmart@gmail.com" className="block text-sm text-slate-400 hover:text-white" data-testid="footer-email-link">Email us</a><a href="/admin" className="block text-sm text-slate-400 hover:text-white" data-testid="footer-admin-link">Admin panel</a></div></div><div><p className="text-xs uppercase tracking-[0.17em] text-[#d7a652]" data-testid="footer-legal-label">Legal</p><div className="mt-5 space-y-3"><a href="mailto:splegalmart@gmail.com?subject=Privacy policy" className="block text-sm text-slate-400 hover:text-white" data-testid="footer-privacy-link">Privacy policy</a><a href="mailto:splegalmart@gmail.com?subject=Terms of service" className="block text-sm text-slate-400 hover:text-white" data-testid="footer-terms-link">Terms of service</a><a href="mailto:splegalmart@gmail.com?subject=Cookie policy" className="block text-sm text-slate-400 hover:text-white" data-testid="footer-cookie-link">Cookie policy</a></div></div></div></div><div className="flex flex-col justify-between gap-4 pt-7 text-xs text-slate-500 sm:flex-row"><p data-testid="footer-copyright">© 2026 SpLegalMart. All rights reserved.</p><p data-testid="footer-tagline">Secure & trusted legal assistance.</p></div></div></footer>

      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3" data-testid="floating-actions"><a href="https://wa.me/917992461191" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#16845b] px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-xl" data-testid="floating-whatsapp-button"><MessageCircle className="size-4" /> WhatsApp</a><a href="https://zoom.us/join" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#0f172a] px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-xl" data-testid="floating-zoom-button"><Video className="size-4" /> Zoom call</a><a href="https://meet.google.com/sp-legal-mart" target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white px-4 py-3 text-xs font-medium uppercase tracking-[0.12em] text-[#0f172a] shadow-lg transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-xl" data-testid="floating-meet-button"><Video className="size-4 text-[#b45309]" /> Google Meet</a><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex size-10 items-center justify-center border border-slate-300 bg-white text-[#0f172a] shadow-lg transition-[transform] duration-200 hover:-translate-y-1" aria-label="Back to top" data-testid="back-to-top-button">↑</button></div>
    </div>
  );
}