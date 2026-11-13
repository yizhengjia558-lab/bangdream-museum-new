import { Suspense } from "react";
import { EventsPageView } from "@/components/events/EventsPageView";
import { getAllEvents } from "@/lib/events";

export default function EventsPage() {
  const events = getAllEvents();
  return (
    <Suspense fallback={null}>
      <EventsPageView events={events} />
    </Suspense>
  );
}
