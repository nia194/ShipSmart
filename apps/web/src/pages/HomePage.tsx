// TODO: [MIGRATION] This page uses useShippingQuotes which calls the legacy
// "get-shipping-quotes" Supabase edge function. Migrate to Java/Python API
// per docs/service-boundaries.md when backend is ready.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { CityInput } from "@/components/shipping/CityInput";
import { StepNum, PriceBadge } from "@/components/shipping/SharedUI";
import { Section } from "@/components/shipping/QuoteRow";
import { CompareSection } from "@/components/shipping/CompareSection";
import { PKG_TYPES, HANDLING, getItemErrors, buildBookUrl, type PackageItem, type ShippingService } from "@/lib/shipping-data";
import { buildSnapshotKey } from "@/hooks/useSavedOptions";
import { useShippingQuotes } from "@/hooks/useShippingQuotes";
import { useRecommendation } from "@/hooks/useRecommendation";
import { useAuth } from "@/contexts/AuthContext";
import { RecommendationCard } from "@/components/advisor/RecommendationCard";
import { SaveSignInModal } from "@/components/auth/SaveSignInModal";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HomePageProps {
  savedIds: Set<string>;
  onSaveService: (svc: ShippingService, context: { origin: string; dest: string; dropDate: string; delivDate: string; pkgSummary: string; bookUrl: string }) => void;
}

const LoadingSkeleton = () => (
  <div style={{ padding: "20px 0" }}>
    {[1, 2].map(s => (
      <div key={s} style={{ marginBottom: 20 }}>
        <div className="shim" style={{ width: 180, height: 16, borderRadius: 8, marginBottom: 10 }} />
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid #eeeff1" }}>
          {[1, 2, 3].map(r => (
            <div key={r} style={{ padding: "16px 18px", borderBottom: "1px solid #f0f0f2", display: "flex", alignItems: "center", gap: 14 }}>
              <div className="shim" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <div className="shim" style={{ width: "60%", height: 14, borderRadius: 6, marginBottom: 6 }} />
                <div className="shim" style={{ width: "40%", height: 10, borderRadius: 5 }} />
              </div>
              <div className="shim" style={{ width: 60, height: 20, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const today = startOfDay(new Date());

export default function HomePage({ savedIds, onSaveService }: HomePageProps) {
  const { user } = useAuth();
  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [step1Done, setStep1Done] = useState(false);
  const [dropDate, setDropDate] = useState<Date | undefined>();
  const [delivDate, setDelivDate] = useState<Date | undefined>();
  const [dropOpen, setDropOpen] = useState(false);
  const [delivOpen, setDelivOpen] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [packages, setPackages] = useState<PackageItem[]>([{ type: "luggage", qty: "1", weight: "", l: "", w: "", h: "", handling: "standard" }]);
  const [submitted, setSubmitted] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [showErr, setShowErr] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareSelected, setCompareSelected] = useState<ShippingService[]>([]);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [pendingSaveService, setPendingSaveService] = useState<ShippingService | null>(null);

  const { loading, data, fetchQuotes } = useShippingQuotes();

  // Flatten all quote services for the recommendation hook
  const allServices = useMemo(() => {
    if (!data) return null;
    const services: ShippingService[] = [];
    if (data.prime) services.push(...(data.prime.top ?? []), ...(data.prime.more ?? []));
    if (data.private) services.push(...(data.private.top ?? []), ...(data.private.more ?? []));
    return services.length > 0 ? services : null;
  }, [data]);

  const { recommendation, loading: recLoading } = useRecommendation(allServices);

  const s2 = useRef<HTMLDivElement>(null);
  const s3 = useRef<HTMLDivElement>(null);
  const res = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLInputElement>(null);

  const dropDateStr = dropDate ? format(dropDate, "yyyy-MM-dd") : "";
  const delivDateStr = delivDate ? format(delivDate, "yyyy-MM-dd") : "";

  const tryAdv1 = useCallback(() => {
    if (origin.trim().length >= 3 && dest.trim().length >= 3 && !step1Done) {
      setStep1Done(true); setEditingStep(null);
      setTimeout(() => s2.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [origin, dest, step1Done]);

  useEffect(() => {
    if (dropDate && delivDate && !step2Done && step1Done) {
      const t = setTimeout(() => {
        setStep2Done(true); setEditingStep(null);
        setTimeout(() => s3.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [dropDate, delivDate, step2Done, step1Done]);

  // If drop-off date changes and deliver-by is before it, reset deliver-by
  useEffect(() => {
    if (dropDate && delivDate && isBefore(delivDate, dropDate)) {
      setDelivDate(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropDate]);

  // Clear compare selections when new results arrive
  useEffect(() => {
    setCompareSelected([]);
  }, [data]);

  // Handle edit-after-results: refresh when editing committed
  const handleEditCommitted = useCallback(() => {
    if (submitted && allValid) {
      // User closed edit dialog with valid values; refetch results
      setCompareSelected([]); // Clear old comparisons
      setOpenId(null); // Close any expanded rows
      setTimeout(() => res.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      fetchQuotes(origin, dest, dropDateStr, delivDateStr, packages);
    }
  }, [submitted, allValid, origin, dest, dropDateStr, delivDateStr, packages, fetchQuotes]);

  const handleToggleCompare = (svc: ShippingService) => {
    setCompareSelected((prev) => {
      const isSelected = prev.some((s) => s.id === svc.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== svc.id);
      } else {
        // Max 3 services in compare
        if (prev.length >= 3) {
          return [prev[1], prev[2], svc];
        }
        return [...prev, svc];
      }
    });
  };

  const handleSaveWithAuth = (svc: ShippingService) => {
    if (!user) {
      setPendingSaveService(svc);
      setSignInModalOpen(true);
    } else {
      onSaveService(svc, { origin, dest, dropDate: dropDateStr, delivDate: delivDateStr, pkgSummary, bookUrl: bUrl(svc) });
    }
  };

  const handleSignInComplete = () => {
    if (pendingSaveService) {
      onSaveService(pendingSaveService, {
        origin,
        dest,
        dropDate: dropDateStr,
        delivDate: delivDateStr,
        pkgSummary,
        bookUrl: bUrl(pendingSaveService),
      });
      setPendingSaveService(null);
    }
  };

  const addPkg = () => setPackages([...packages, { type: "boxes", qty: "1", weight: "", l: "", w: "", h: "", handling: "standard" }]);
  const rmPkg = (i: number) => { if (packages.length > 1) setPackages(packages.filter((_, idx) => idx !== i)); };
  const upPkg = (i: number, f: string, v: string) => {
    // Clamp negative values for numeric fields
    if (["qty", "weight", "l", "w", "h"].includes(f)) {
      const num = parseFloat(v);
      if (v !== "" && num < 0) return; // block negative input
    }
    setPackages(packages.map((p, idx) => idx === i ? { ...p, [f]: v } : p));
  };

  const tw = packages.reduce((a, p) => a + (parseFloat(p.weight) || 0) * (parseInt(p.qty) || 1), 0);
  const ti = packages.reduce((a, p) => a + (parseInt(p.qty) || 1), 0);
  const allValid = packages.every(p => p.weight && parseFloat(p.weight) > 0 && p.l && p.w && p.h && p.qty && parseInt(p.qty) >= 1);
  const anyW = packages.some(p => p.weight && parseFloat(p.weight) > 0);
  const pStep = useMemo(() => { if (anyW && step2Done) return 3; if (step2Done) return 2; if (step1Done) return 1; return 0; }, [step1Done, step2Done, anyW]);

  const submit = () => {
    if (!allValid) { setShowErr(true); return; }
    setShowErr(false); setSubmitted(true); setEditingStep(null); setOpenId(null);
    setTimeout(() => res.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    fetchQuotes(origin, dest, dropDateStr, delivDateStr, packages);
  };

  const toggle = (id: string) => setOpenId(openId === id ? null : id);
  const bUrl = (svc: ShippingService) => buildBookUrl(svc, origin, dest, dropDateStr, delivDateStr, packages);
  const pkgSummary = `${ti} pkg${ti > 1 ? "s" : ""} \u00B7 ${tw} lbs`;

  /** Check if a service is saved for the current search context */
  const isServiceSaved = (svc: ShippingService) => {
    const key = buildSnapshotKey(svc.id, origin, dest, dropDateStr, delivDateStr);
    return savedIds.has(key);
  };

  return (
    <div>
      {!submitted && (
        <div style={{ textAlign: "center", padding: "36px 20px 4px", animation: "fadeIn .5s both" }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.4px" }}>Compare. Ship. Save.</h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>UPS, FedEx, DHL & private shippers — one search.</p>
        </div>
      )}

      <div style={{ maxWidth: 780, margin: submitted ? "8px auto 0" : "20px auto 0", padding: "0 16px" }}>
        {/* STEP 1 */}
        <div className="ss-card" style={{ zIndex: 10 }}>
          {step1Done && editingStep !== 1 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <StepNum n="1" done />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{origin}</span>
                <span style={{ color: "#d1d5db" }}>{"\u2192"}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{dest}</span>
              </div>
              <button className="ss-btn ss-btn-outline ss-btn-sm" onClick={() => setEditingStep(1)}>Edit</button>
            </div>
          ) : (
            <div style={{ padding: "18px 20px 16px", animation: "fadeIn .2s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <StepNum n="1" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Pickup & Delivery Location</span>
                {step1Done && <span onClick={() => setEditingStep(null)} style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", cursor: "pointer" }}>{"\u2715"}</span>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <CityInput value={origin} onChange={setOrigin} onSelect={c => { setOrigin(c); setTimeout(() => destRef.current?.focus(), 50); }} placeholder="From \u2014 city or ZIP" icon={"\u25C9"} />
                <div onClick={() => { const t = origin; setOrigin(dest); setDest(t); }} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", cursor: "pointer", fontSize: 12, color: "#9ca3af", flexShrink: 0, marginTop: 2 }}>{"\u21C4"}</div>
                <CityInput inputRef={destRef} value={dest} onChange={setDest} onSelect={c => { setDest(c); setTimeout(tryAdv1, 100); }} placeholder="To \u2014 city or ZIP" icon={"\u25CE"} onBlurExtra={tryAdv1} />
              </div>
            </div>
          )}
        </div>
        {pStep === 1 && <PriceBadge amount="39.00" label="based on route" />}

        {/* STEP 2 — Airbnb-style date pickers */}
        {step1Done && (
          <>
            <div className="ss-card" ref={s2} style={{ animation: "fadeUp .3s both" }}>
              {step2Done && editingStep !== 2 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <StepNum n="2" done />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{dropDate ? format(dropDate, "MMM d, yyyy") : ""}</span>
                    <span style={{ color: "#d1d5db" }}>{"\u2192"}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{delivDate ? format(delivDate, "MMM d, yyyy") : ""}</span>
                  </div>
                  <button className="ss-btn ss-btn-outline ss-btn-sm" onClick={() => setEditingStep(2)}>Edit</button>
                </div>
              ) : (
                <div style={{ padding: "18px 20px 16px", animation: "fadeIn .2s both" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <StepNum n="2" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Shipping Dates</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".8px" }}>Drop-off</label>
                      <Popover open={dropOpen} onOpenChange={setDropOpen}>
                        <PopoverTrigger asChild>
                          <button className="ss-inp" style={{ textAlign: "left", cursor: "pointer", color: dropDate ? "#111827" : "#b0b5c0" }}>
                            {dropDate ? format(dropDate, "MMM d, yyyy") : "Select date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 200 }}>
                          <Calendar
                            mode="single"
                            selected={dropDate}
                            onSelect={(d) => {
                              setDropDate(d);
                              setDropOpen(false);
                              if (!delivDate) setTimeout(() => setDelivOpen(true), 150);
                            }}
                            disabled={(date) => isBefore(date, today)}
                            autoFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".8px" }}>Deliver By</label>
                      <Popover open={delivOpen} onOpenChange={setDelivOpen}>
                        <PopoverTrigger asChild>
                          <button className="ss-inp" style={{ textAlign: "left", cursor: "pointer", color: delivDate ? "#111827" : "#b0b5c0" }}>
                            {delivDate ? format(delivDate, "MMM d, yyyy") : "Select date"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 200 }}>
                          <Calendar
                            mode="single"
                            selected={delivDate}
                            onSelect={(d) => { setDelivDate(d); setDelivOpen(false); }}
                            disabled={(date) => {
                              const minDate = dropDate ? dropDate : today;
                              return isBefore(date, minDate);
                            }}
                            autoFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {pStep === 2 && <PriceBadge amount="42.10" label="route & dates" />}
          </>
        )}

        {/* STEP 3 */}
        {step2Done && (
          <>
            <div className="ss-card" ref={s3} style={{ animation: "fadeUp .3s both" }}>
              {submitted && editingStep !== 3 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <StepNum n="3" done />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{ti} item{ti > 1 ? "s" : ""}</span>
                    <span style={{ padding: "3px 10px", borderRadius: 7, background: "#f3f4f6", fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{tw} lbs</span>
                  </div>
                  <button className="ss-btn ss-btn-outline ss-btn-sm" onClick={() => setEditingStep(3)}>Edit</button>
                </div>
              ) : (
                <div style={{ padding: "18px 20px 16px", animation: "fadeIn .2s both" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <StepNum n="3" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Your Items</span>
                    {submitted && <span onClick={() => setEditingStep(null)} style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", cursor: "pointer" }}>{"\u2715"}</span>}
                  </div>

                  {packages.map((pkg, i) => {
                    const errs = showErr ? getItemErrors(pkg) : [];
                    return (
                      <div key={i} className={`ss-pkg-item ${errs.length ? "err" : ""}`} style={{ animationDelay: `${i * 0.05}s` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Item {i + 1}</span>
                          {packages.length > 1 && <button onClick={() => rmPkg(i)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                          {PKG_TYPES.map(p => (
                            <div key={p.id} className={`ss-typ-c ${pkg.type === p.id ? "on" : ""}`} onClick={() => upPkg(i, "type", p.id)}>
                              <span style={{ fontSize: 14 }}>{p.icon}</span>{p.label}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 }}>
                          <div style={{ width: 56 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Qty</label>
                            <input className={`ss-sn ${showErr && (!pkg.qty || parseInt(pkg.qty) < 1) ? "err" : ""}`} style={{ width: "100%" }} type="number" min="1" placeholder="1" value={pkg.qty} onChange={e => upPkg(i, "qty", e.target.value)} />
                          </div>
                          <div style={{ width: 76 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Wt (lbs)</label>
                            <input className={`ss-sn ${showErr && !pkg.weight ? "err" : ""}`} style={{ width: "100%" }} placeholder="0" type="number" min="0" value={pkg.weight} onChange={e => upPkg(i, "weight", e.target.value)} />
                          </div>
                          <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                            <div><label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 3 }}>L</label><input className={`ss-sn ${showErr && !pkg.l ? "err" : ""}`} placeholder={"\u2014"} type="number" min="0" value={pkg.l} onChange={e => upPkg(i, "l", e.target.value)} /></div>
                            <span style={{ color: "#d1d5db", fontWeight: 700, fontSize: 11, marginBottom: 9 }}>{"\u00D7"}</span>
                            <div><label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 3 }}>W</label><input className={`ss-sn ${showErr && !pkg.w ? "err" : ""}`} placeholder={"\u2014"} type="number" min="0" value={pkg.w} onChange={e => upPkg(i, "w", e.target.value)} /></div>
                            <span style={{ color: "#d1d5db", fontWeight: 700, fontSize: 11, marginBottom: 9 }}>{"\u00D7"}</span>
                            <div><label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 3 }}>H</label><input className={`ss-sn ${showErr && !pkg.h ? "err" : ""}`} placeholder={"\u2014"} type="number" min="0" value={pkg.h} onChange={e => upPkg(i, "h", e.target.value)} /></div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {HANDLING.map(h => <button key={h.id} className={`ss-sel-h ${pkg.handling === h.id ? "on" : ""}`} onClick={() => upPkg(i, "handling", h.id)}>{h.label}</button>)}
                        </div>
                        {errs.length > 0 && (
                          <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
                            {errs.map((e, ei) => <div key={ei} style={{ fontSize: 11, color: "#dc2626", fontWeight: 500 }}>{"\u26A0"} {e}</div>)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button className="ss-add-btn" onClick={addPkg}><span style={{ fontSize: 20 }}>+</span> Add Another Item</button>

                  {anyW && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#f9fafb", border: "1px solid #f0f0f2" }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>{ti} item{ti > 1 ? "s" : ""} {"\u00B7"} <strong style={{ color: "#111827" }}>{tw} lbs</strong></span>
                    </div>
                  )}

                  <button
                    className="ss-btn ss-btn-primary"
                    style={{ marginTop: 14 }}
                    disabled={!allValid}
                    onClick={submit}
                  >
                    Compare Shipping Rates {"\u2192"}
                  </button>
                </div>
              )}
            </div>
            {pStep === 3 && !submitted && <PriceBadge amount="42.10" label="estimate" />}
          </>
        )}

        {/* RESULTS */}
        {submitted && (
          <div ref={res} style={{ padding: "8px 0 80px" }}>
            {loading ? <LoadingSkeleton /> : data && (
              <div style={{ animation: "fadeIn .3s both" }}>
                {/* Compare Section */}
                <CompareSection selectedServices={compareSelected} onRemove={(serviceId) => handleToggleCompare(compareSelected.find(s => s.id === serviceId)!)} />

                {data.prime && (
                  <Section
                    icon={"\uD83C\uDFE2"} title="Prime Providers" subtitle="Major carriers with guaranteed service levels"
                    badge={{ bg: "#eff6ff", c: "#1d4ed8", label: "VERIFIED" }}
                    topRows={data.prime.top ?? []} moreRows={data.prime.more ?? []}
                    openId={openId} onToggle={toggle} animBase={0.1}
                    buildUrl={bUrl}
                    savedIds={new Set((data.prime.top ?? []).concat(data.prime.more ?? []).filter(s => isServiceSaved(s)).map(s => s.id))}
                    onSaveService={handleSaveWithAuth}
                    compareSelected={compareSelected}
                    onToggleCompare={handleToggleCompare}
                    origin={origin} dest={dest}
                  />
                )}
                {data.private && (
                  <Section
                    icon={"\uD83D\uDE80"} title="Private Providers" subtitle="Specialized shippers for luggage & personal items"
                    badge={{ bg: "#f0fdf4", c: "#15803d", label: "SPECIALIST" }}
                    topRows={data.private.top ?? []} moreRows={data.private.more ?? []}
                    openId={openId} onToggle={toggle} animBase={0.3}
                    buildUrl={bUrl}
                    savedIds={new Set((data.private.top ?? []).concat(data.private.more ?? []).filter(s => isServiceSaved(s)).map(s => s.id))}
                    onSaveService={handleSaveWithAuth}
                    compareSelected={compareSelected}
                    onToggleCompare={handleToggleCompare}
                    origin={origin} dest={dest}
                  />
                )}

                {/* AI Recommendation Panel */}
                {recLoading && (
                  <div style={{ marginTop: 20, padding: "16px 18px", borderRadius: 14, border: "1.5px solid #eeeff1", background: "#f9fafb" }}>
                    <div className="shim" style={{ width: 200, height: 16, borderRadius: 8, marginBottom: 10 }} />
                    <div className="shim" style={{ width: "80%", height: 12, borderRadius: 6 }} />
                  </div>
                )}
                {recommendation && !recLoading && (
                  <div style={{ marginTop: 20, animation: "fadeIn .3s both" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 16 }}>💡</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>AI Recommendation</span>
                    </div>
                    <RecommendationCard
                      recommendation={recommendation.primary_recommendation}
                      isHighlighted={true}
                    />
                    {recommendation.alternatives.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        {recommendation.alternatives.slice(0, 2).map((alt) => (
                          <RecommendationCard
                            key={alt.service_name}
                            recommendation={alt}
                            isHighlighted={false}
                          />
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>{recommendation.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sign In Modal for Save */}
        <SaveSignInModal open={signInModalOpen} onOpenChange={setSignInModalOpen} onSignInComplete={handleSignInComplete} />
      </div>
    </div>
  );
}
