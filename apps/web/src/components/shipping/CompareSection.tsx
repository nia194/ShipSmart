import { ShippingService } from "@/lib/shipping-data";
import { Logo } from "./Logo";

interface CompareSectionProps {
  selectedServices: ShippingService[];
  onRemove: (serviceId: string) => void;
}

export const CompareSection = ({ selectedServices, onRemove }: CompareSectionProps) => {
  if (selectedServices.length < 2) return null;

  const cols = selectedServices.length;
  const colWidth = 100 / cols;

  return (
    <div style={{ marginTop: 32, marginBottom: 20, animation: "fadeUp .3s both" }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span>📊</span>Compare {selectedServices.length} Services
      </div>

      <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid #eeeff1", background: "#fff" }}>
        {/* Header Row */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0, borderBottom: "1.5px solid #f0f0f2" }}>
          {selectedServices.map((svc) => (
            <div key={svc.id} style={{ padding: "16px 14px", textAlign: "center", borderRight: svc.id !== selectedServices[selectedServices.length - 1].id ? "1px solid #f0f0f2" : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <Logo name={svc.carrier} sz={28} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{svc.name}</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>{svc.carrier}</div>
                </div>
                <button
                  onClick={() => onRemove(svc.id)}
                  style={{
                    marginTop: 4,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#dc2626",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Rows */}
        {[
          {
            label: "Service Tier",
            getValue: (s: ShippingService) => s.tier,
          },
          {
            label: "Price",
            getValue: (s: ShippingService) => (
              <>
                {s.originalPrice && <div style={{ fontSize: 10, color: "#9ca3af", textDecoration: "line-through" }}>${s.originalPrice}</div>}
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>${s.price}</div>
              </>
            ),
          },
          {
            label: "Delivery Time",
            getValue: (s: ShippingService) => (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.transitDays}d</div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{s.date}</div>
              </>
            ),
          },
          {
            label: "Guaranteed",
            getValue: (s: ShippingService) => (
              <div style={{ fontSize: 12, color: s.guaranteed ? "#15803d" : "#9ca3af", fontWeight: s.guaranteed ? 700 : 500 }}>
                {s.guaranteed ? "✓ Yes" : "—"}
              </div>
            ),
          },
          {
            label: "Promo",
            getValue: (s: ShippingService) =>
              s.promo ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>{s.promo.pct} OFF</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>Save ${s.promo.save}</div>
                </div>
              ) : (
                <div style={{ color: "#9ca3af" }}>—</div>
              ),
          },
          {
            label: "Features",
            getValue: (s: ShippingService) =>
              s.features.length > 0 ? (
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
                  {s.features.slice(0, 2).map((f) => (
                    <span
                      key={f}
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "#f0f5ff",
                        color: "#0071e3",
                        fontSize: 9,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                  {s.features.length > 2 && (
                    <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600 }}>+{s.features.length - 2}</span>
                  )}
                </div>
              ) : (
                <div style={{ color: "#9ca3af" }}>—</div>
              ),
          },
        ].map((row, idx) => (
          <div key={row.label} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0, borderBottom: idx < 4 ? "1px solid #f0f0f2" : "none" }}>
            <div style={{ padding: "12px 14px", gridColumn: "1 / -1", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", background: "#f9fafb" }}>
              {row.label}
            </div>
            {selectedServices.map((svc) => (
              <div
                key={svc.id}
                style={{
                  padding: "12px 14px",
                  textAlign: "center",
                  fontSize: 13,
                  color: "#374151",
                  borderRight: svc.id !== selectedServices[selectedServices.length - 1].id ? "1px solid #f0f0f2" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {typeof row.getValue(svc) === "string" ? row.getValue(svc) : row.getValue(svc)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
