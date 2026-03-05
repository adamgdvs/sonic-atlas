const TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2";

interface TicketmasterEvent {
    name: string;
    dates: {
        start: {
            localDate: string;
            localTime?: string;
        };
    };
    url: string;
    _embedded?: {
        venues?: Array<{
            name: string;
            city?: { name: string };
            state?: { name: string };
            country?: { name: string; countryCode: string };
        }>;
    };
}

export interface TourStatus {
    hasEvents: boolean;
    eventCount: number;
    nextEvent?: {
        name: string;
        date: string;
        venue: string;
        city: string;
        url: string;
    };
}

/**
 * Search for an artist's upcoming events via Ticketmaster Discovery API.
 * Returns tour status with event count and next event details.
 */
export async function getArtistTourStatus(artistName: string): Promise<TourStatus> {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
        return { hasEvents: false, eventCount: 0 };
    }

    try {
        // Search for the attraction (artist) by keyword
        const searchUrl = `${TICKETMASTER_BASE}/attractions.json?apikey=${apiKey}&keyword=${encodeURIComponent(artistName)}&size=1`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return { hasEvents: false, eventCount: 0 };

        const searchData = await searchRes.json();
        const attractions = searchData._embedded?.attractions;
        if (!attractions || attractions.length === 0) {
            return { hasEvents: false, eventCount: 0 };
        }

        const attractionId = attractions[0].id;

        // Get upcoming events for this attraction
        const eventsUrl = `${TICKETMASTER_BASE}/events.json?apikey=${apiKey}&attractionId=${attractionId}&size=5&sort=date,asc`;
        const eventsRes = await fetch(eventsUrl);
        if (!eventsRes.ok) return { hasEvents: false, eventCount: 0 };

        const eventsData = await eventsRes.json();
        const events: TicketmasterEvent[] = eventsData._embedded?.events || [];
        const totalCount = eventsData.page?.totalElements || events.length;

        if (events.length === 0) {
            return { hasEvents: false, eventCount: 0 };
        }

        const next = events[0];
        const venue = next._embedded?.venues?.[0];

        return {
            hasEvents: true,
            eventCount: totalCount,
            nextEvent: {
                name: next.name,
                date: next.dates.start.localDate,
                venue: venue?.name || "TBA",
                city: [venue?.city?.name, venue?.state?.name || venue?.country?.name]
                    .filter(Boolean).join(", ") || "TBA",
                url: next.url,
            },
        };
    } catch (error) {
        console.error("Ticketmaster API error:", error);
        return { hasEvents: false, eventCount: 0 };
    }
}
