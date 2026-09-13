import type { InvitationStatus, VisitStatus, VerificationStatus } from "@/lib/types";

const invitationStyles: Record<InvitationStatus, string> = {
  pending: "bg-brass/10 text-brass-dark border-brass/20",
  accepted: "bg-sage/10 text-sage-dim border-sage/20",
  declined: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-ink/5 text-ink/50 border-ink/10",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

const visitStyles: Record<VisitStatus, string> = {
  pending: "bg-brass/10 text-brass-dark border-brass/20",
  authorized: "bg-brass/10 text-brass-dark border-brass/20",
  checked_in: "bg-blue-50 text-blue-700 border-blue-200",
  checked_out: "bg-ink/5 text-ink/50 border-ink/10",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  expired: "bg-ink/5 text-ink/50 border-ink/10",
  denied: "bg-red-50 text-red-700 border-red-200",
};

const visitLabels: Partial<Record<VisitStatus, string>> = {
  checked_in: "Active",
  authorized: "Pending Approval",
  checked_out: "Completed",
};

const verificationStyles: Record<VerificationStatus, string> = {
  pending: "bg-brass/10 text-brass-dark border-brass/20",
  verified: "bg-sage/10 text-sage-dim border-sage/20",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const roleStyles: Record<string, string> = {
  visitor: "bg-brass/10 text-brass-dark border-brass/20",
  resident: "bg-sage/10 text-sage-dim border-sage/20",
  guard: "bg-blue-50 text-blue-700 border-blue-200",
  admin: "bg-purple-50 text-purple-700 border-purple-200",
};

export function StatusBadge({
  status,
  type = "visit",
}: {
  status: string;
  type?: "invitation" | "visit" | "verification" | "role";
}) {
  let styles = "bg-ink/5 text-ink/50 border-ink/10";
  let label = status.replace(/_/g, " ");
  if (type === "invitation") {
    styles = invitationStyles[status as InvitationStatus] ?? styles;
  } else if (type === "visit") {
    styles = visitStyles[status as VisitStatus] ?? styles;
    label = visitLabels[status as VisitStatus] ?? label;
  } else if (type === "verification") {
    styles = verificationStyles[status as VerificationStatus] ?? styles;
  } else if (type === "role") {
    styles = roleStyles[status] ?? styles;
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase ${styles}`}>
      {label}
    </span>
  );
}
