import { FolderPlus, Inbox, Edit, PenLine, ShieldCheck, Banknote, Send, FileCheck, CalendarClock, FolderX, HelpCircle } from "lucide-react";
import type { NatureEvenement } from "@/domain/consultation-detail";
import { NATURE_SCHEMAS } from "@/lib/natures";

const ICON_MAP: Record<string, any> = {
  OUVERTURE: FolderPlus,
  CENTRALISATION: Inbox,
  MODIFICATION: Edit,
  ACCEPTATION: PenLine,
  LEVEE_RESERVE: ShieldCheck,
  REGLEMENT: Banknote,
  AVIS_SORT: Send,
  MAINLEVEE: FileCheck,
  PROROGATION: CalendarClock,
  CLOTURE: FolderX,
};

export default function NatureIcon({ nature, size = 16 }: { nature: NatureEvenement; size?: number }) {
  const schema = NATURE_SCHEMAS[nature];
  const Icon = ICON_MAP[nature] ?? HelpCircle;
  return <Icon size={size} className="shrink-0" aria-label={schema?.libelle ?? nature} />;
}
