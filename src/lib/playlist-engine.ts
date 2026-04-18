export interface PlaylistSeedSummary {
  artists: string[];
  genres: string[];
}

export interface PlaylistCandidateTrack {
  title: string;
  artist: string;
  url: string;
  videoId?: string;
  coverUrl?: string | null;
  genres: string[];
  sourceLabel: string;
  sourceType: "artist" | "genre";
  discoveryScore: number;
  reason: string;
}

export interface GeneratedDiscoveryMix {
  name: string;
  description: string;
  generatedAt: string;
  rationale: string[];
  seeds: PlaylistSeedSummary;
  tracks: PlaylistCandidateTrack[];
}

interface CandidateArtist {
  name: string;
  image?: string | null;
  genres: string[];
  score?: number;
}

interface CandidatePool {
  source: string;
  sourceType: "artist" | "genre";
  artists: CandidateArtist[];
}

interface BuildMixInput {
  candidatePools: CandidatePool[];
  tasteSeeds: PlaylistSeedSummary;
  maxTracks?: number;
}

interface TrackLookupResult {
  image: string | null;
  tracks: Array<{
    title: string;
    preview: string;
    videoId?: string | null;
  }>;
}

function titleKey(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function artistKey(name: string) {
  return name.trim().toLowerCase();
}

function scoreGenreOverlap(candidateGenres: string[], seedGenres: string[]) {
  if (candidateGenres.length === 0 || seedGenres.length === 0) return 0;
  const seedSet = new Set(seedGenres.map((genre) => genre.toLowerCase()));
  return candidateGenres.reduce(
    (score, genre) => score + (seedSet.has(genre.toLowerCase()) ? 0.25 : 0),
    0
  );
}

function buildReason(sourceType: "artist" | "genre", source: string, candidateGenres: string[]) {
  if (sourceType === "artist") {
    return `Connected through ${source}`;
  }
  if (candidateGenres.length > 0) {
    return `Pulled from your ${source} lane and adjacent ${candidateGenres[0]}`;
  }
  return `Pulled from your ${source} lane`;
}

function sequenceTracks(
  tracks: PlaylistCandidateTrack[],
  seedGenres: string[],
  maxTracks: number
) {
  const genreSet = new Set(seedGenres.map((genre) => genre.toLowerCase()));
  const artistSeen = new Set<string>();
  const ordered = [...tracks].sort((a, b) => {
    const aGenreBoost = a.genres.some((genre) => genreSet.has(genre.toLowerCase())) ? 0.2 : 0;
    const bGenreBoost = b.genres.some((genre) => genreSet.has(genre.toLowerCase())) ? 0.2 : 0;
    return b.discoveryScore + bGenreBoost - (a.discoveryScore + aGenreBoost);
  });

  const sequenced: PlaylistCandidateTrack[] = [];
  const deferred: PlaylistCandidateTrack[] = [];

  for (const track of ordered) {
    const normalizedArtist = artistKey(track.artist);
    if (artistSeen.has(normalizedArtist)) {
      deferred.push(track);
      continue;
    }
    artistSeen.add(normalizedArtist);
    sequenced.push(track);
    if (sequenced.length >= maxTracks) return sequenced;
  }

  for (const track of deferred) {
    sequenced.push(track);
    if (sequenced.length >= maxTracks) break;
  }

  return sequenced;
}

export async function buildGeneratedDiscoveryMix(
  input: BuildMixInput,
  lookupArtistTracks: (artistName: string) => Promise<TrackLookupResult>
): Promise<GeneratedDiscoveryMix> {
  const maxTracks = input.maxTracks ?? 12;
  const pools = [...input.candidatePools].sort((a, b) => {
    const aPeak = Math.max(...a.artists.map((artist) => artist.score ?? 0), 0);
    const bPeak = Math.max(...b.artists.map((artist) => artist.score ?? 0), 0);
    return bPeak - aPeak;
  });

  const candidates: PlaylistCandidateTrack[] = [];
  const seenTracks = new Set<string>();

  for (const pool of pools) {
    const rankedArtists = [...pool.artists].sort(
      (a, b) =>
        (b.score ?? 0) +
          scoreGenreOverlap(b.genres, input.tasteSeeds.genres) -
          ((a.score ?? 0) + scoreGenreOverlap(a.genres, input.tasteSeeds.genres))
    );

    for (const artist of rankedArtists.slice(0, 6)) {
      const previewData = await lookupArtistTracks(artist.name);
      const playable = previewData.tracks.find((track) => track.videoId || track.preview);
      if (!playable) continue;

      const candidateGenres = artist.genres.filter(Boolean);
      const trackId = `${artistKey(artist.name)}:${titleKey(playable.title)}`;
      if (seenTracks.has(trackId)) continue;
      seenTracks.add(trackId);

      candidates.push({
        title: playable.title,
        artist: artist.name,
        url: playable.preview || "",
        videoId: playable.videoId || undefined,
        coverUrl: previewData.image || artist.image || null,
        genres: candidateGenres,
        sourceLabel: pool.source,
        sourceType: pool.sourceType,
        discoveryScore:
          (artist.score ?? 0.35) +
          scoreGenreOverlap(candidateGenres, input.tasteSeeds.genres) +
          (pool.sourceType === "artist" ? 0.12 : 0.06),
        reason: buildReason(pool.sourceType, pool.source, candidateGenres),
      });

      if (candidates.length >= maxTracks * 2) break;
    }

    if (candidates.length >= maxTracks * 2) break;
  }

  const tracks = sequenceTracks(candidates, input.tasteSeeds.genres, maxTracks);
  const monthDay = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return {
    name: `Daily Discovery • ${monthDay}`,
    description:
      "Generated from your My Atlas artists, recent listening patterns, and adjacent genre signals.",
    generatedAt: new Date().toISOString(),
    rationale: [
      input.tasteSeeds.artists.length > 0
        ? `Anchored to ${input.tasteSeeds.artists.slice(0, 3).join(", ")}`
        : "Anchored to your current listening history",
      input.tasteSeeds.genres.length > 0
        ? `Weighted toward ${input.tasteSeeds.genres.slice(0, 3).join(", ")}`
        : "Weighted toward adjacent discovery lanes",
      "Sequenced to avoid immediate artist repetition and keep the mix moving",
    ],
    seeds: input.tasteSeeds,
    tracks,
  };
}
