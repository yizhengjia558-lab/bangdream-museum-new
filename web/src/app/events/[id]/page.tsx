import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/events/EventDetailView";
import { getEventIds, resolveEvent } from "@/lib/events";

export function generateStaticParams() {
  return getEventIds().map((id) => ({ id }));
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  const event = resolveEvent(resolved.id);
  if (!event) notFound();

  return (
    <Suspense fallback={null}>
      <EventDetailView event={event} />
    </Suspense>
  );
}
