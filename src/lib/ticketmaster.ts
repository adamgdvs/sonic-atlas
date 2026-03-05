const TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2";

interface TicketmasterAttraction {
    id: string;
    name: string;
    type: string;
    classifications?: Array<{
        segment?: { name: string };
        genre?: { name: string };
    }>;
}

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
 * Normalize artist name for comparison.
 * Strips accents, lowercases, removes "the " prefix, trims whitespace.
 */
function normalizeName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/^the\s+/, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

/**
 * Search for an artist's upcoming events via Ticketmaster Discovery API.
 * Uses EXACT name matching to avoid cover bands and tribute acts.
 */
export async function getArtistTourStatus(artistName: string): Promise<TourStatus> {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
        return { hasEvents: false, eventCount: 0 };
    }

    try {
        // Search for attractions by keyword — request multiple results to find exact match
        const searchUrl = `${TICKETMASTER_BASE}/attractions.json?apikey=${apiKey}&keyword=${encodeURIComponent(artistName)}&size=10&classificationName=music`;
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) return { hasEvents: false, eventCount: 0 };

        const searchData = await searchRes.json();
        const attractions: TicketmasterAttraction[] = searchData._embedded?.attractions || [];
        if (attractions.length === 0) {
            return { hasEvents: false, eventCount: 0 };
        }

        // EXACT name matching — find the attraction whose name matches our artist
        const normalizedSearch = normalizeName(artistName);
        const exactMatch = attractions.find(a => normalizeName(a.name) === normalizedSearch);

        if (!exactMatch) {
            // No exact match found — don't show tour data for a different artist
            console.log(`Ticketmaster: No exact match for "${artistName}". Candidates: ${attractions.map(a => a.name).join(", ")}`);
            return { hasEvents: false, eventCount: 0 };
        }

        // Get upcoming events for the EXACT matched attraction
        const eventsUrl = `${TICKETMASTER_BASE}/events.json?apikey=${apiKey}&attractionId=${exactMatch.id}&size=5&sort=date,asc`;
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
