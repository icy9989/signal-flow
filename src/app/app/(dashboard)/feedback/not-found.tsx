import Link from "next/link";
import { feedbackLinkClass } from "@/components/feedback/inbox";
export default function FeedbackNotFound() {
  return <section className="space-y-4"><h1 className="text-2xl font-semibold">Feedback unavailable</h1><p className="text-sm text-secondary">This feedback could not be found in the active project.</p><Link href="/app/feedback" className={feedbackLinkClass}>Back to feedback</Link></section>;
}
