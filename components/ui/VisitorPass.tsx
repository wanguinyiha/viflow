export default function VisitorPass({
  visitorName,
  residentName,
  hostel,
  room,
  visitDate,
  validFrom,
  visitCode,
  className = "",
}: {
  visitorName: string;
  residentName: string;
  hostel: string;
  room: string;
  visitDate: string;
  validFrom: string;
  visitCode: string;
  className?: string;
}) {
  return (
    <div className={`relative w-[320px] ${className}`}>
      <div className="rounded-card bg-ink text-parchment shadow-[0_20px_45px_-15px_rgba(22,35,59,0.55)]">
        <div className="flex justify-center pt-4">
          <div className="hole-punch bg-ink shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)]" />
        </div>
        <div className="perf-edge-bottom px-6 pb-7 pt-3" style={{ ["--perf-bg" as string]: "#16233B" }}>
          <p className="font-mono text-[11px] uppercase text-brass-light">Visitor pass</p>
          <h2 className="mt-2 font-display text-2xl italic">{visitorName}</h2>
          <p className="mt-1 text-sm text-parchment/70">Visiting {room}, {hostel}</p>
          <p className="text-sm text-parchment/70">Host: {residentName}</p>
          <p className="mt-2 text-sm text-parchment/50">{visitDate}</p>
          <p className="font-mono text-xs text-parchment/40">
            Arrival: {validFrom}
          </p>

          <div className="mt-5 flex items-end justify-between">
            <div className="grid grid-cols-5 gap-[3px]" aria-hidden="true">
              {Array.from({ length: 25 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-[6px] w-[6px] ${
                    [0, 2, 4, 5, 9, 10, 14, 15, 19, 20, 22, 24, 12, 6, 8, 16, 18].includes(i)
                      ? "bg-parchment"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
            <span className="rounded-sm border border-sage-light px-2 py-1 font-mono text-[11px] uppercase text-sage-light">
              Authorized
            </span>
          </div>
        </div>
        <div className="bg-ink-light px-6 py-4 text-center">
          <p className="font-mono text-[11px] uppercase text-parchment/50 mb-1">Your Visit Code</p>
          <p className="font-mono text-2xl font-bold tracking-wider text-parchment">{visitCode}</p>
          <p className="font-mono text-[11px] text-parchment/40 mt-1">Show this code at the gate</p>
        </div>
      </div>
    </div>
  );
}
