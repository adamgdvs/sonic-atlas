import type { CatalogEntry, CatalogCategory } from "@/lib/curated-catalog";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function entry(
  title: string,
  subtitle: string,
  category: CatalogCategory,
  searchQuery: string,
  tags: string[] = []
): CatalogEntry {
  return { slug: slug(title), title, subtitle, category, searchQuery, tags };
}

// ─── Moods (artist-anchored queries for real track resolution) ────────────────

const MOODS: CatalogEntry[] = [
  entry("Happy Days", "Bright, easy serotonin", "mood", "Pharrell Williams happy feel good upbeat hits playlist", ["happy", "upbeat", "feel good"]),
  entry("Good Vibes Only", "Pure positivity, zero filler", "mood", "Justin Timberlake Bruno Mars good vibes happy songs", ["positive", "happy"]),
  entry("Euphoria", "Peak energy, peak joy", "mood", "Dua Lipa Harry Styles euphoric feel good pop songs", ["euphoric", "uplifting"]),
  entry("Sunshine Hits", "Songs that feel like sunlight", "mood", "Kacey Musgraves Jack Johnson sunshine bright uplifting songs", ["sunny", "bright"]),
  entry("Feel Good Friday", "End-of-week energy drop", "mood", "Mark Ronson Cardi B Lizzo feel good Friday songs", ["feel good", "weekend"]),
  entry("Instant Mood Lift", "Fast-acting sonic serotonin", "mood", "Beyonce Taylor Swift instant mood boost pop anthems", ["upbeat", "energetic"]),

  entry("Sad Hours", "Songs for the hard nights", "mood", "Phoebe Bridgers Bon Iver sad emotional indie songs", ["sad", "emotional"]),
  entry("Heartbreak Hotel", "Post-breakup listening ward", "mood", "Olivia Rodrigo Adele heartbreak breakup songs playlist", ["heartbreak", "sad love"]),
  entry("Blue Midnight", "Quiet pain, slow tempo", "mood", "Sufjan Stevens Grouper blue sad slow songs", ["melancholy", "slow"]),
  entry("Crying in the Car", "Let it all out", "mood", "Sam Smith Lewis Capaldi crying emotional ballads", ["emotional", "sad"]),
  entry("Melancholy Signal", "Bittersweet and beautiful", "mood", "Radiohead Daughter melancholy bittersweet songs", ["melancholy", "introspective"]),
  entry("Rainy Window", "Grey skies, warm feelings", "mood", "Nick Drake Elliott Smith rainy day sad introspective songs", ["rainy", "contemplative"]),

  entry("Chill Mode", "Zero stress, full drift", "mood", "Frank Ocean Daniel Caesar SZA chill R&B vibes", ["chill", "relaxed"]),
  entry("Sunday Slow Down", "Gentle pace, no rush", "mood", "Leon Bridges H.E.R. Sunday chill soul songs", ["chill", "sunday"]),
  entry("Afternoon Drift", "Lazy afternoon energy", "mood", "Mac DeMarco Mild High Club afternoon chill indie", ["chill", "lazy"]),
  entry("Mellow Gold", "Soft and golden", "mood", "Big Thief Angel Olsen mellow soft indie folk", ["mellow", "soft"]),
  entry("Low Key Flex", "Laid back but still cool", "mood", "Tyler the Creator Steve Lacy low key smooth grooves", ["chill", "smooth"]),

  entry("Hype Mode", "Maximum energy activation", "mood", "Travis Scott Drake Future hype trap energy playlist", ["hype", "energetic", "pump up"]),
  entry("Pump Up", "Pre-game fuel injection", "mood", "Kendrick Lamar Jay-Z pump up motivational rap songs", ["pump up", "motivational"]),
  entry("Adrenaline Rush", "Unstoppable momentum", "mood", "Eminem Linkin Park adrenaline rush high energy songs", ["adrenaline", "intense"]),
  entry("Beast Mode", "Train like you mean it", "mood", "DMX Lil Jon beast mode gym workout songs", ["beast mode", "intense"]),

  entry("Romantic Evening", "Candlelight and close harmony", "mood", "John Legend Al Green romantic evening love songs", ["romantic", "love"]),
  entry("Love Songs", "All the feelings, all the time", "mood", "Ed Sheeran Beyonce love songs playlist classics", ["love", "romance"]),
  entry("Slow Dance", "Pull someone close", "mood", "Usher Luther Vandross slow dance R&B songs", ["slow dance", "romantic"]),
  entry("Late Night Romance", "Dim lights, soft music", "mood", "The Weeknd Miguel late night R&B romance songs", ["romantic", "late night"]),

  entry("Deep Nostalgia", "Memories in audio form", "mood", "Fleetwood Mac Elton John deep nostalgia classic hits", ["nostalgic", "memories"]),
  entry("Throwback Feels", "Takes you straight back", "mood", "90s 2000s throwback pop hits Backstreet Boys NSYNC", ["throwback", "nostalgic"]),
  entry("Old School Vibes", "When music felt different", "mood", "Marvin Gaye Curtis Mayfield old school soul R&B", ["old school", "retro"]),

  entry("Angry Hours", "Channeled frustration", "mood", "Rage Against the Machine System of a Down angry rock songs", ["angry", "intense", "aggressive"]),
  entry("Catharsis", "Feel it all and release", "mood", "Alanis Morissette Fiona Apple cathartic emotional songs", ["cathartic", "release"]),
  entry("Rage Fuel", "Maximum intensity output", "mood", "Slipknot Korn Pantera rage metal intensity", ["rage", "intense"]),

  entry("Dark Frequencies", "Brooding, low-lit energy", "mood", "The Weeknd Billie Eilish dark moody atmospheric songs", ["dark", "brooding"]),
  entry("Midnight Thoughts", "Late night introspection", "mood", "Bon Iver Sufjan Stevens midnight introspective songs", ["midnight", "introspective"]),
  entry("Noir Signal", "Shadows and slow tempos", "mood", "Tom Waits Nick Cave dark noir noir songs", ["dark", "noir", "moody"]),

  entry("Hopeful", "Light at the end", "mood", "Chance the Rapper Janelle Monae hopeful uplifting songs", ["hopeful", "optimistic"]),
  entry("New Beginnings", "Fresh start energy", "mood", "Florence and the Machine Sigur Ros new beginnings songs", ["hopeful", "new start"]),
  entry("Determined", "Eyes forward, no doubt", "mood", "Kendrick Lamar J. Cole determined motivational rap", ["determined", "motivated"]),
  entry("Confidence Boost", "Walk taller with this on", "mood", "Lizzo Cardi B Beyonce confidence empowerment anthems", ["confident", "empowering"]),

  entry("Dreamy State", "Half-awake and floating", "mood", "Beach House Mazzy Star dreamy shoegaze ethereal songs", ["dreamy", "ethereal"]),
  entry("Daydream", "Soft focus, soft sound", "mood", "Tame Impala Washed Out daydream psychedelic indie", ["dreamy", "soft"]),
  entry("Hazy Afternoon", "Warm and unfocused", "mood", "Khruangbin Real Estate hazy warm afternoon indie", ["hazy", "mellow"]),

  entry("Peaceful Mind", "Still water, clear air", "mood", "Brian Eno Nils Frahm peaceful calming ambient piano", ["peaceful", "calm"]),
  entry("Zen State", "Presence over urgency", "mood", "Satie Arvo Pärt zen calm meditation classical", ["zen", "calm"]),
  entry("Gratitude", "Slow appreciation", "mood", "Bill Withers Van Morrison gratitude soulful warm songs", ["gratitude", "positive"]),

  entry("Mysterious", "Something just under the surface", "mood", "Portishead Massive Attack mysterious dark atmospheric", ["mysterious", "eerie"]),
  entry("Tense Atmosphere", "Edge-of-seat sound design", "mood", "Thom Yorke Ennio Morricone tense atmospheric cinematic", ["tense", "suspense"]),
  entry("Introspective", "Turn inward, sit with it", "mood", "James Blake Daughter introspective emotional indie", ["introspective", "thoughtful"]),
  entry("Spiritual", "Something larger than self", "mood", "John Coltrane Alice Coltrane spiritual jazz devotional", ["spiritual", "soulful"]),
];

// ─── Genres ───────────────────────────────────────────────────────────────────

const GENRES: CatalogEntry[] = [
  entry("Indie Rock", "Guitars, hooks, and attitude", "genre", "indie rock essentials playlist", ["indie", "rock"]),
  entry("Indie Pop", "Bright indie with pop shine", "genre", "indie pop playlist", ["indie pop"]),
  entry("Indie Folk", "Soft-spoken and story-driven", "genre", "indie folk playlist", ["indie folk"]),
  entry("Garage Rock", "Raw, scrappy, loud", "genre", "garage rock playlist", ["garage rock"]),
  entry("Surf Rock", "Sun-drenched reverb waves", "genre", "surf rock playlist", ["surf rock"]),
  entry("Psychedelic Rock", "Expanded minds, expanded sounds", "genre", "psychedelic rock playlist", ["psychedelic"]),
  entry("Classic Rock", "Timeless electric authority", "genre", "classic rock playlist", ["classic rock"]),
  entry("Hard Rock", "Heavy guitar energy", "genre", "hard rock playlist", ["hard rock"]),
  entry("Heavy Metal", "Down-tuned dominance", "genre", "heavy metal playlist", ["metal", "heavy"]),
  entry("Thrash Metal", "Speed and aggression", "genre", "thrash metal playlist", ["thrash", "metal"]),
  entry("Doom Metal", "Slow, crushing, massive", "genre", "doom metal playlist", ["doom metal"]),
  entry("Black Metal", "Freezing and raw", "genre", "black metal playlist", ["black metal"]),
  entry("Prog Rock", "Technical complexity, epic scale", "genre", "progressive rock playlist", ["prog rock"]),
  entry("Post-Rock", "Instrumental builds to the sky", "genre", "post rock playlist", ["post rock"]),
  entry("Math Rock", "Odd time signatures, clean tones", "genre", "math rock playlist", ["math rock"]),
  entry("Emo", "Vulnerability amplified", "genre", "emo playlist", ["emo"]),
  entry("Screamo", "Raw and ragged catharsis", "genre", "screamo playlist", ["screamo", "emo"]),
  entry("Punk", "Short, fast, defiant", "genre", "punk rock playlist", ["punk"]),
  entry("Post-Punk", "Cold and angular", "genre", "post punk playlist", ["post punk"]),
  entry("New Wave", "Electronic meets punk energy", "genre", "new wave playlist", ["new wave"]),
  entry("Alternative Rock", "Off-centre, undeniable", "genre", "alternative rock playlist", ["alternative"]),
  entry("Grunge", "Seattle distortion cloud", "genre", "grunge playlist", ["grunge"]),
  entry("Shoegaze", "Walls of layered reverb", "genre", "shoegaze playlist", ["shoegaze"]),
  entry("Dream Pop", "Hazy shimmer and drift", "genre", "dream pop playlist", ["dream pop"]),
  entry("Noise Rock", "Abrasive and intentional", "genre", "noise rock playlist", ["noise rock"]),
  entry("Krautrock", "German hypnotic groove", "genre", "krautrock playlist", ["krautrock"]),

  entry("Soul", "Warmth from the chest", "genre", "soul music playlist", ["soul"]),
  entry("Classic Soul", "Motown and golden-era voices", "genre", "classic soul playlist", ["classic soul"]),
  entry("Neo Soul", "Modern soul depth", "genre", "neo soul playlist", ["neo soul"]),
  entry("Funk", "The groove that locks you in", "genre", "funk playlist", ["funk"]),
  entry("R&B", "Rhythm, feeling, presence", "genre", "r&b playlist", ["r&b"]),
  entry("Contemporary R&B", "Modern textured R&B", "genre", "contemporary r&b playlist", ["modern r&b"]),
  entry("Quiet Storm", "Slow, smooth, late night R&B", "genre", "quiet storm r&b playlist", ["quiet storm"]),
  entry("Gospel", "Devotion in full voice", "genre", "gospel music playlist", ["gospel"]),
  entry("Blues", "Twelve bars of truth", "genre", "blues music playlist", ["blues"]),
  entry("Delta Blues", "Raw and ancient Delta sound", "genre", "delta blues playlist", ["delta blues"]),
  entry("Chicago Blues", "Electric city blues", "genre", "chicago blues playlist", ["chicago blues"]),
  entry("Disco", "The floor is yours", "genre", "disco playlist", ["disco"]),
  entry("Nu Disco", "Disco reborn in the modern era", "genre", "nu disco playlist", ["nu disco"]),
  entry("Funk Soul", "Groove-forward fusion", "genre", "funk soul playlist", ["funk", "soul"]),

  entry("Hip-Hop", "Bars over beats", "genre", "hip hop playlist", ["hip hop", "rap"]),
  entry("Boom Bap", "Classic sample-based knock", "genre", "boom bap hip hop playlist", ["boom bap"]),
  entry("Golden Era Hip-Hop", "90s peak rap craft", "genre", "golden era hip hop playlist", ["golden era"]),
  entry("Underground Hip-Hop", "Left-field lyricism", "genre", "underground hip hop playlist", ["underground rap"]),
  entry("Trap", "808s and hi-hat rolls", "genre", "trap music playlist", ["trap"]),
  entry("Drill", "Menacing and minimal", "genre", "drill music playlist", ["drill"]),
  entry("Lo-Fi Hip-Hop", "Dusty loops for quiet hours", "genre", "lofi hip hop playlist", ["lofi", "beats"]),
  entry("Jazz Rap", "Intellectual bars, jazz chords", "genre", "jazz rap playlist", ["jazz rap"]),
  entry("Conscious Rap", "Lyricism with purpose", "genre", "conscious rap playlist", ["conscious rap"]),
  entry("West Coast Rap", "Sun, bass, lowriders", "genre", "west coast rap playlist", ["west coast rap"]),
  entry("East Coast Rap", "New York state of mind", "genre", "east coast rap playlist", ["east coast rap"]),
  entry("Southern Hip-Hop", "Crunk, chopped, and screwed", "genre", "southern hip hop playlist", ["southern rap"]),

  entry("House", "Four-on-the-floor foundation", "genre", "house music playlist", ["house"]),
  entry("Deep House", "Warm basement groove", "genre", "deep house playlist", ["deep house"]),
  entry("Tech House", "Driving and functional", "genre", "tech house playlist", ["tech house"]),
  entry("Acid House", "303 and pure ecstasy", "genre", "acid house playlist", ["acid house"]),
  entry("Garage House", "Chicago and New York roots", "genre", "garage house playlist", ["garage house"]),
  entry("Afro House", "African percussion, club floor", "genre", "afro house playlist", ["afro house"]),
  entry("Techno", "Detroit machinery and discipline", "genre", "techno playlist", ["techno"]),
  entry("Trance", "Build, drop, ascend", "genre", "trance music playlist", ["trance"]),
  entry("Drum & Bass", "170 BPM split-second breaks", "genre", "drum and bass playlist", ["drum and bass", "dnb"]),
  entry("Jungle", "Amen break, raw energy", "genre", "jungle music playlist", ["jungle"]),
  entry("Dubstep", "Heavy bass oscillation", "genre", "dubstep playlist", ["dubstep"]),
  entry("Grime", "UK garage's angular cousin", "genre", "grime music playlist", ["grime"]),
  entry("UK Garage", "2-step shuffle from London", "genre", "uk garage playlist", ["uk garage"]),
  entry("Ambient", "Atmosphere over rhythm", "genre", "ambient music playlist", ["ambient"]),
  entry("IDM", "Intelligent dance and broken beats", "genre", "idm intelligent dance music playlist", ["idm"]),
  entry("Synthwave", "Neon-soaked analog revival", "genre", "synthwave playlist", ["synthwave"]),
  entry("Vaporwave", "Aesthetic and ironic nostalgia", "genre", "vaporwave playlist", ["vaporwave"]),
  entry("Chillwave", "Hazy lo-fi electronic drift", "genre", "chillwave playlist", ["chillwave"]),
  entry("Electronica", "Experimental electronic exploration", "genre", "electronica playlist", ["electronica"]),
  entry("EDM", "Festival-ready drops", "genre", "edm playlist", ["edm"]),

  entry("Jazz", "Improvisation and conversation", "genre", "jazz playlist", ["jazz"]),
  entry("Bebop", "Fast tempos, complex harmony", "genre", "bebop jazz playlist", ["bebop"]),
  entry("Cool Jazz", "Relaxed and refined", "genre", "cool jazz playlist", ["cool jazz"]),
  entry("Hard Bop", "Bluesy and soulful jazz", "genre", "hard bop jazz playlist", ["hard bop"]),
  entry("Modal Jazz", "Miles, Coltrane, open space", "genre", "modal jazz playlist", ["modal jazz"]),
  entry("Free Jazz", "Outside the changes", "genre", "free jazz playlist", ["free jazz"]),
  entry("Jazz Fusion", "Electric meets improvisation", "genre", "jazz fusion playlist", ["jazz fusion"]),
  entry("Smooth Jazz", "Easy and polished", "genre", "smooth jazz playlist", ["smooth jazz"]),
  entry("Latin Jazz", "Cuban rhythm and jazz harmony", "genre", "latin jazz playlist", ["latin jazz"]),
  entry("Bossa Nova", "Brazilian sway and whisper", "genre", "bossa nova playlist", ["bossa nova"]),

  entry("Pop", "Melodic hooks for everyone", "genre", "pop hits playlist", ["pop"]),
  entry("Art Pop", "Experimental and melodic", "genre", "art pop playlist", ["art pop"]),
  entry("Synth Pop", "Polished electronic melodies", "genre", "synth pop playlist", ["synth pop"]),
  entry("Baroque Pop", "Orchestral and ornate", "genre", "baroque pop playlist", ["baroque pop"]),
  entry("Chamber Pop", "Strings and intimacy", "genre", "chamber pop playlist", ["chamber pop"]),
  entry("Dance Pop", "Melody meets the floor", "genre", "dance pop playlist", ["dance pop"]),
  entry("Power Pop", "Big hooks, bigger guitars", "genre", "power pop playlist", ["power pop"]),

  entry("Country", "Open roads and honest words", "genre", "country music playlist", ["country"]),
  entry("Outlaw Country", "Rough edges, no compromise", "genre", "outlaw country playlist", ["outlaw country"]),
  entry("Americana", "Roots, dust, and truth", "genre", "americana playlist", ["americana"]),
  entry("Bluegrass", "Acoustic speed and precision", "genre", "bluegrass playlist", ["bluegrass"]),
  entry("Folk", "Voice and story, nothing else", "genre", "folk music playlist", ["folk"]),
  entry("Contemporary Folk", "Modern folk sound", "genre", "contemporary folk playlist", ["folk"]),
  entry("Freak Folk", "Strange and acoustic", "genre", "freak folk playlist", ["freak folk"]),

  entry("Classical", "The canon and beyond", "genre", "classical music playlist", ["classical"]),
  entry("Baroque", "Counterpoint and clarity", "genre", "baroque music playlist", ["baroque"]),
  entry("Romantic Classical", "Emotion at orchestral scale", "genre", "romantic classical music playlist", ["romantic classical"]),
  entry("Modern Classical", "20th century and forward", "genre", "modern classical music playlist", ["modern classical"]),
  entry("Minimalist Classical", "Repetition and slow change", "genre", "minimalist classical playlist", ["minimalist"]),
  entry("Piano Essentials", "Keys and pure expression", "genre", "piano music playlist", ["piano"]),
  entry("String Quartet", "Four strings, infinite depth", "genre", "string quartet playlist", ["strings", "chamber"]),

  entry("Reggae", "Riddim and roots", "genre", "reggae playlist", ["reggae"]),
  entry("Roots Reggae", "Conscious and righteous", "genre", "roots reggae playlist", ["roots reggae"]),
  entry("Dancehall", "Kingston party frequency", "genre", "dancehall playlist", ["dancehall"]),
  entry("Ska", "Upstroke pulse", "genre", "ska music playlist", ["ska"]),
  entry("Dub", "Bass in the echo chamber", "genre", "dub music playlist", ["dub"]),

  entry("Afrobeats", "West African energy exported worldwide", "genre", "afrobeats playlist", ["afrobeats"]),
  entry("Afropop", "Melodic pan-African pop", "genre", "afropop playlist", ["afropop"]),
  entry("Highlife", "Ghanaian brass and swing", "genre", "highlife music playlist", ["highlife"]),
  entry("Amapiano", "South African log drum groove", "genre", "amapiano playlist", ["amapiano"]),
  entry("K-Pop", "Precision and spectacle", "genre", "kpop playlist", ["k-pop", "kpop"]),
  entry("K-Indie", "Seoul bedroom and cafe sounds", "genre", "k-indie playlist", ["k-indie"]),
  entry("City Pop", "Tokyo bubble-era glamour", "genre", "city pop playlist", ["city pop"]),
  entry("J-Pop", "Japanese melodic pop", "genre", "j-pop playlist", ["j-pop"]),
  entry("Latin Pop", "Romance in every chord", "genre", "latin pop playlist", ["latin pop"]),
  entry("Reggaeton", "Dembow pattern, global reach", "genre", "reggaeton playlist", ["reggaeton"]),
  entry("Salsa", "Brass, percussion, movement", "genre", "salsa music playlist", ["salsa"]),
  entry("Cumbia", "Colombian coastal pulse", "genre", "cumbia playlist", ["cumbia"]),
];

// ─── Eras ─────────────────────────────────────────────────────────────────────

const ERAS: CatalogEntry[] = [
  entry("50s Rock & Roll", "The birth of the electric age", "era", "1950s rock and roll playlist", ["50s"]),
  entry("60s Pop", "Beatles era brightness", "era", "1960s pop playlist", ["60s", "60s pop"]),
  entry("60s Soul", "Motown and Stax golden run", "era", "1960s soul playlist", ["60s soul"]),
  entry("60s Psychedelic", "Expanded consciousness, wide reverb", "era", "1960s psychedelic playlist", ["60s psychedelic"]),
  entry("60s Folk Revival", "Dylan, protest, acoustic truth", "era", "1960s folk playlist", ["60s folk"]),
  entry("70s Rock", "Album-side dominance", "era", "1970s rock playlist", ["70s rock"]),
  entry("70s Funk", "James Brown era groove", "era", "1970s funk playlist", ["70s funk"]),
  entry("70s Disco", "Mirror ball paradise", "era", "1970s disco playlist", ["70s disco"]),
  entry("70s Punk", "Three chords and fury", "era", "1970s punk playlist", ["70s punk"]),
  entry("70s Soul", "Philadelphia and beyond", "era", "1970s soul playlist", ["70s soul"]),
  entry("70s Singer-Songwriter", "Laurel Canyon and confessional", "era", "1970s singer songwriter playlist", ["70s folk"]),
  entry("80s Pop", "Big hooks, bigger hair", "era", "1980s pop playlist", ["80s pop"]),
  entry("80s Rock", "Power chords and arenas", "era", "1980s rock playlist", ["80s rock"]),
  entry("80s Metal", "Spandex and stadium solos", "era", "1980s heavy metal playlist", ["80s metal"]),
  entry("80s New Wave", "Synths and angular cool", "era", "1980s new wave playlist", ["80s new wave"]),
  entry("80s Hip-Hop", "Break beats and block parties", "era", "1980s hip hop playlist", ["80s hip hop"]),
  entry("80s R&B", "Smooth grooves and shoulder pads", "era", "1980s r&b playlist", ["80s r&b"]),
  entry("80s Electronic", "Roland boxes and MIDI everything", "era", "1980s electronic playlist", ["80s electronic"]),
  entry("90s Pop", "TRL peak, pure melody", "era", "1990s pop playlist", ["90s pop"]),
  entry("90s Rock", "Alternative radio dominance", "era", "1990s rock playlist", ["90s rock"]),
  entry("90s Grunge", "Seattle and distortion", "era", "1990s grunge playlist", ["90s grunge"]),
  entry("90s Alternative", "College radio gold", "era", "1990s alternative playlist", ["90s alternative"]),
  entry("90s Hip-Hop", "Golden era lyricism", "era", "1990s hip hop playlist", ["90s hip hop"]),
  entry("90s R&B", "Slow jams and multi-harmonies", "era", "1990s r&b playlist", ["90s r&b"]),
  entry("90s Dance", "Eurodance and club anthems", "era", "1990s dance playlist", ["90s dance"]),
  entry("90s Electronic", "Rave and jungle emergence", "era", "1990s electronic playlist", ["90s electronic"]),
  entry("90s Britpop", "Oasis, Blur, British invasion", "era", "1990s britpop playlist", ["britpop"]),
  entry("2000s Pop", "Pop princess and boy band era", "era", "2000s pop playlist", ["2000s pop"]),
  entry("2000s Indie", "Blog-era guitar explosion", "era", "2000s indie playlist", ["2000s indie"]),
  entry("2000s Hip-Hop", "Bling era, snap, ringtone rap", "era", "2000s hip hop playlist", ["2000s hip hop"]),
  entry("2000s Emo", "Eyeliner and catharsis", "era", "2000s emo playlist", ["2000s emo"]),
  entry("2000s R&B", "Usher, Beyoncé, neo-smooth", "era", "2000s r&b playlist", ["2000s r&b"]),
  entry("2000s Electronic", "Electro and microhouse", "era", "2000s electronic playlist", ["2000s electronic"]),
  entry("2000s Rock", "Post-grunge and nu-metal", "era", "2000s rock playlist", ["2000s rock"]),
  entry("2010s Pop", "Streaming-era hooks", "era", "2010s pop playlist", ["2010s pop"]),
  entry("2010s Hip-Hop", "Trap era takeover", "era", "2010s hip hop playlist", ["2010s hip hop"]),
  entry("2010s Indie", "Bedroom pop and festival indie", "era", "2010s indie playlist", ["2010s indie"]),
  entry("2010s R&B", "Alt-R&B and Frank Ocean era", "era", "2010s r&b playlist", ["2010s r&b"]),
  entry("2010s Electronic", "Future bass and tropical house", "era", "2010s electronic playlist", ["2010s electronic"]),
  entry("Early 2020s", "Post-pandemic pop and rap", "era", "early 2020s hits playlist", ["2020s"]),
];

// ─── Activities ───────────────────────────────────────────────────────────────

const ACTIVITIES: CatalogEntry[] = [
  entry("Morning Run", "Pace yourself into the day", "vibe", "morning run playlist", ["running", "morning"]),
  entry("Heavy Lifting", "Iron and raw power", "vibe", "heavy lifting gym playlist", ["lifting", "gym"]),
  entry("Cardio Burn", "Keep the heart rate up", "vibe", "cardio workout playlist", ["cardio"]),
  entry("HIIT Session", "Short bursts, full effort", "vibe", "hiit workout playlist", ["hiit", "workout"]),
  entry("Yoga Flow", "Breath-synced movement", "vibe", "yoga music playlist", ["yoga"]),
  entry("Meditation", "Space between the thoughts", "vibe", "meditation music playlist", ["meditation"]),
  entry("Stretching Session", "Ease in, ease out", "vibe", "stretching relaxing playlist", ["stretching"]),
  entry("Study Session", "Focus locked, distractions off", "vibe", "study music playlist", ["study"]),
  entry("Deep Work", "Flow state maintenance", "vibe", "deep work focus playlist", ["focus", "work"]),
  entry("Coding Session", "Headphones on, world off", "vibe", "coding focus playlist", ["coding", "focus"]),
  entry("Reading Companion", "Background for deep reading", "vibe", "reading background music playlist", ["reading"]),
  entry("Morning Coffee", "Gentle start to the day", "vibe", "morning coffee playlist", ["morning", "coffee"]),
  entry("Wake Up Call", "From bed to moving", "vibe", "wake up morning energy playlist", ["morning", "energetic"]),
  entry("Commute Soundtrack", "Transit time well spent", "vibe", "commute playlist", ["commute"]),
  entry("Road Trip", "Miles and playlists", "vibe", "road trip playlist", ["road trip", "driving"]),
  entry("Midnight Drive", "Empty roads, full volume", "vibe", "midnight drive playlist", ["midnight", "drive"]),
  entry("Late Night Drive", "City lights, open windows", "vibe", "late night drive playlist", ["late night", "drive"]),
  entry("Sunday Drive", "No destination, just motion", "vibe", "sunday drive playlist", ["sunday", "drive"]),
  entry("Dinner Party", "Food, friends, curated sound", "vibe", "dinner party playlist", ["dinner", "social"]),
  entry("Cooking Session", "Kitchen energy", "vibe", "cooking music playlist", ["cooking"]),
  entry("House Party", "Room full of people moving", "vibe", "house party playlist", ["party"]),
  entry("Pre-Game", "Before the night begins", "vibe", "pregame playlist", ["pregame", "party"]),
  entry("After Party", "The wind-down after the peak", "vibe", "after party playlist", ["after party"]),
  entry("Sunday Brunch", "Late start, good company", "vibe", "sunday brunch playlist", ["brunch", "sunday"]),
  entry("Beach Day", "Sand, sun, easy sound", "vibe", "beach day playlist", ["beach", "summer"]),
  entry("Pool Party", "Warm water, louder sound", "vibe", "pool party playlist", ["pool", "summer"]),
  entry("Hiking Trail", "Outdoor rhythm and stride", "vibe", "hiking outdoor playlist", ["hiking", "outdoor"]),
  entry("Camping Fire", "Acoustic under open sky", "vibe", "camping acoustic playlist", ["camping", "acoustic"]),
  entry("Gaming Session", "Immersion and reaction time", "vibe", "gaming music playlist", ["gaming"]),
  entry("Night Gaming", "Late session, locked in", "vibe", "late night gaming playlist", ["gaming", "night"]),
  entry("Shower Bangers", "Hits that hit harder wet", "vibe", "shower songs playlist", ["shower", "fun"]),
  entry("Work From Home", "Productive domestic energy", "vibe", "work from home playlist", ["work", "focus"]),
  entry("Bedtime", "Ease into sleep", "vibe", "bedtime sleep songs playlist", ["sleep", "bedtime"]),
  entry("Power Nap", "Twenty minutes of reset", "vibe", "power nap relaxing playlist", ["nap", "relaxing"]),
];

// ─── Scenes & Vibes ───────────────────────────────────────────────────────────

const SCENES: CatalogEntry[] = [
  entry("Rainy Day In", "Grey outside, warm inside", "vibe", "rainy day indoor playlist", ["rainy", "cozy"]),
  entry("Winter Fireplace", "Log crackling, soft sound", "vibe", "winter cozy fireplace playlist", ["winter", "cozy"]),
  entry("Coffee Shop", "Background hum of productivity", "vibe", "coffee shop music playlist", ["coffee shop"]),
  entry("Library Mode", "Quiet focus, no lyrics needed", "vibe", "library study instrumental playlist", ["library", "quiet"]),
  entry("Golden Hour", "That perfect light and feeling", "vibe", "golden hour sunset playlist", ["golden hour", "sunset"]),
  entry("Sunset Session", "Day closing, volume rising", "vibe", "sunset songs playlist", ["sunset"]),
  entry("City After Dark", "Neon, pavement, late hours", "vibe", "city night playlist", ["city", "night"]),
  entry("After Midnight", "The real late-night crowd", "vibe", "after midnight playlist", ["midnight", "late night"]),
  entry("Friday Night", "Permission to let go", "vibe", "friday night playlist", ["friday", "night out"]),
  entry("Saturday Morning", "Slow wake, no agenda", "vibe", "saturday morning playlist", ["saturday", "morning"]),
  entry("Weekend Energy", "Two days of freedom", "vibe", "weekend vibes playlist", ["weekend"]),
  entry("Rooftop Session", "Open sky, good company", "vibe", "rooftop party playlist", ["rooftop"]),
  entry("Hotel Room", "Anywhere, detached, floating", "vibe", "hotel room songs playlist", ["hotel", "travel"]),
  entry("Train Journey", "Motion and landscape blur", "vibe", "train journey playlist", ["train", "travel"]),
  entry("Summer Night", "Warm air, fireflies", "vibe", "summer night playlist", ["summer", "night"]),
  entry("Late Summer", "Dying warmth, back-to-school ache", "vibe", "late summer songs playlist", ["late summer"]),
  entry("Autumn Leaves", "Cooling air, changing color", "vibe", "autumn fall playlist", ["autumn", "fall"]),
  entry("Winter Nights", "Cold outside, inside warmth", "vibe", "winter night songs playlist", ["winter"]),
  entry("Spring Awakening", "New energy, new light", "vibe", "spring songs playlist", ["spring"]),
  entry("Midnight Garden", "Quiet dark, gentle grow", "vibe", "midnight garden songs playlist", ["midnight", "peaceful"]),
  entry("Desert Highway", "Vast and silent speed", "vibe", "desert highway driving playlist", ["desert", "driving"]),
  entry("Ocean Drive", "Salt air and horizon", "vibe", "ocean drive coastal playlist", ["ocean", "coast"]),
  entry("Forest Walk", "Birdsong and footsteps", "vibe", "forest walk nature playlist", ["forest", "nature"]),
  entry("Urban Jungle", "Concrete rhythm and pace", "vibe", "urban city songs playlist", ["urban", "city"]),
  entry("Late Night Bar", "Last call atmosphere", "vibe", "late night bar songs playlist", ["bar", "late night"]),
  entry("House Show", "Living room and basement gigs", "vibe", "house show indie playlist", ["indie", "intimate"]),
  entry("Record Store", "The eternal flip and discover", "vibe", "record store vibes playlist", ["vinyl", "indie"]),
  entry("Back Seat Window", "Motion and watching", "vibe", "back seat window songs playlist", ["travel", "dreamy"]),
  entry("Empty Stadium", "Anthem in the echo", "vibe", "stadium anthems playlist", ["anthems", "epic"]),
  entry("Neon Nights", "Candy-colored darkness", "vibe", "neon night songs playlist", ["neon", "night"]),
];

// ─── African Music ────────────────────────────────────────────────────────────

const AFRICAN: CatalogEntry[] = [
  // West Africa – Nigeria
  entry("Naija Afrobeats", "Burna Boy, Wizkid, Davido — the Lagos sound", "genre", "Burna Boy Wizkid Davido afrobeats Nigeria playlist", ["afrobeats", "nigeria"]),
  entry("Afrobeats Classics", "Early Fela Kuti era — the origin point", "genre", "Fela Kuti afrobeats classics Nigeria playlist", ["afrobeats", "fela kuti", "classic"]),
  entry("Afropop Wave", "Rema, Asake, Fireboy — new generation Lagos", "genre", "Rema Asake Fireboy DML afropop Nigeria 2020s", ["afropop", "new gen"]),
  entry("Jùjú Music", "King Sunny Ade — talking drums and guitars", "genre", "King Sunny Ade Ebenezer Obey juju music Nigeria", ["juju", "nigeria"]),
  entry("Afrobeats x Dancehall", "Lagos meets Kingston riddim", "genre", "afrobeats dancehall fusion playlist", ["afrobeats", "dancehall"]),
  entry("Afro-Fusion", "Genre-defying pan-African sounds", "genre", "Burna Boy afro-fusion world music playlist", ["afro-fusion"]),

  // West Africa – Ghana
  entry("Ghana Highlife", "E.T. Mensah era brass and guitar swing", "genre", "Ghana highlife E.T. Mensah classic playlist", ["highlife", "ghana"]),
  entry("Hiplife", "Ghanaian hip hop meets highlife", "genre", "hiplife Ghana Reggie Rockstone playlist", ["hiplife", "ghana"]),
  entry("Azonto", "Ghanaian street dance and party music", "genre", "azonto Ghana party dance music playlist", ["azonto", "ghana"]),
  entry("Ghana Modern", "Stonebwoy, Sarkodie, Shatta Wale — Accra now", "genre", "Stonebwoy Sarkodie Shatta Wale Ghana music 2020s", ["ghana", "modern"]),

  // West Africa – Senegal & Mali
  entry("Mbalax", "Youssou N'Dour — Sabar drums and Wolof soul", "genre", "Youssou NDour Baaba Maal mbalax Senegal playlist", ["mbalax", "senegal"]),
  entry("Griot Tradition", "West African praise singers — kora and balafon", "genre", "Toumani Diabate kora Mali griot music playlist", ["griot", "mali", "kora"]),
  entry("Mali Blues", "Tinariwen, Ali Farka Touré — desert guitar", "genre", "Ali Farka Toure Tinariwen Mali blues desert guitar", ["mali blues", "desert blues"]),

  // East Africa
  entry("Ethiopian Jazz", "Mulatu Astatke — Ethio-jazz from Addis", "genre", "Mulatu Astatke Ethiopian jazz Ethio-jazz Addis Ababa", ["ethio-jazz", "ethiopia"]),
  entry("Ethiopian Pop", "Modern Habesha melodies and beats", "genre", "Ethiopian pop music modern playlist Teddy Afro", ["ethiopia", "pop"]),
  entry("Bongo Flava", "Tanzanian hip hop meets taarab", "genre", "Bongo Flava Tanzania Diamond Platnumz playlist", ["bongo flava", "tanzania"]),
  entry("Gengetone", "Nairobi street rap — sheng and bass", "genre", "Gengetone Kenya Nairobi hip hop playlist 2020s", ["gengetone", "kenya"]),
  entry("Benga", "Kenyan electric folk — guitar and luo rhythm", "genre", "Benga Kenya D.O. Misiani guitar folk playlist", ["benga", "kenya"]),
  entry("Taarab", "Swahili coast Arabic-influenced song", "genre", "Taarab Zanzibar Swahili coast music playlist", ["taarab", "swahili"]),

  // Central Africa
  entry("Soukous", "Congolese rumba and guitar — dance of the Congo", "genre", "Soukous Congolese rumba Papa Wemba playlist", ["soukous", "congo"]),
  entry("Ndombolo", "Congo Brazzaville fast-paced dance groove", "genre", "Ndombolo Congo dance music Koffi Olomide playlist", ["ndombolo", "congo"]),

  // North Africa
  entry("Gnawa", "Moroccan trance ritual — guembri and krakebs", "genre", "Gnawa Morocco trance ritual music Maalem playlist", ["gnawa", "morocco"]),
  entry("Chaabi", "North African street folk — Algerian and Moroccan", "genre", "Chaabi Algeria Morocco folk music playlist", ["chaabi", "north africa"]),
  entry("Rai", "Algerian rebel pop — from Oran to Paris", "genre", "Rai Algeria Khaled Cheb Mami rebel pop playlist", ["rai", "algeria"]),
  entry("Egyptian Pop", "Cairo love songs — Amr Diab and golden era", "genre", "Amr Diab Nancy Ajram Egyptian Arabic pop playlist", ["egypt", "arabic pop"]),

  // Southern Africa
  entry("Amapiano Now", "Log drum takeover — South Africa 2020s", "genre", "Amapiano South Africa DJ Maphorisa Kabza De Small playlist", ["amapiano", "south africa"]),
  entry("Kwaito", "South African township house — 90s golden age", "genre", "Kwaito South Africa TKZee Boom Shaka 90s playlist", ["kwaito", "south africa"]),
  entry("South African Jazz", "Cape jazz and township sound", "genre", "South African jazz Abdullah Ibrahim Cape Town playlist", ["south african jazz"]),
  entry("Maskandi", "Zulu guitar folk — izigqi zasokhozini", "genre", "Maskandi Zulu folk guitar South Africa playlist", ["maskandi", "zulu"]),
  entry("Zimbabwe Sungura", "Guitar-driven Zimbabwean dance music", "genre", "Sungura Zimbabwe Thomas Mapfumo chimurenga playlist", ["sungura", "zimbabwe"]),

  // Pan-African
  entry("Pan-African Sounds", "Continent-wide showcase", "genre", "pan-African music best playlist Africa 2020s", ["pan-african"]),
  entry("African Electronic", "Club music from Lagos to Cape Town", "genre", "African electronic club music DJ playlist 2020s", ["african electronic"]),
  entry("Afrobeats Global", "When Lagos met London, Paris, Toronto", "genre", "afrobeats global diaspora playlist UK US 2020s", ["afrobeats", "global"]),
];

// ─── British Music ─────────────────────────────────────────────────────────────

const BRITISH: CatalogEntry[] = [
  entry("UK Rap", "Stormzy, Dave, Little Simz — British bars", "genre", "Stormzy Dave Little Simz UK rap playlist 2020s", ["uk rap", "british hip hop"]),
  entry("Grime Origins", "Skepta, Dizzee Rascal — garage's angry offspring", "genre", "Skepta Dizzee Rascal Wiley grime classics playlist", ["grime", "uk"]),
  entry("South London Sound", "Dave, Ghetts, AJ Tracey — south London streets", "genre", "Dave Ghetts AJ Tracey south London rap playlist", ["south london", "uk rap"]),
  entry("British Soul", "Amy Winehouse, Adele, Sam Smith — UK soul gold", "genre", "Amy Winehouse Adele Sam Smith British soul playlist", ["british soul", "uk"]),
  entry("Bristol Sound", "Massive Attack, Portishead, Tricky — trip-hop city", "genre", "Massive Attack Portishead Tricky Bristol trip-hop playlist", ["bristol", "trip-hop"]),
  entry("Madchester", "Stone Roses, Happy Mondays — baggy and blissed", "genre", "Stone Roses Happy Mondays Madchester playlist 90s", ["madchester", "manchester"]),
  entry("Britpop Golden Era", "Oasis, Blur, Pulp, Elastica — peak 90s UK", "genre", "Oasis Blur Pulp Elastica Britpop 1990s playlist", ["britpop", "90s uk"]),
  entry("British Indie", "Arctic Monkeys, The Libertines, Bloc Party", "genre", "Arctic Monkeys Libertines Bloc Party British indie playlist", ["british indie"]),
  entry("Scottish Indie", "Frightened Rabbit, Biffy Clyro, Belle & Sebastian", "genre", "Frightened Rabbit Belle Sebastian Scottish indie playlist", ["scottish", "indie"]),
  entry("Northern Soul", "Wigan Casino — 60s American soul on UK dancefloors", "genre", "Northern Soul Wigan Casino rare soul 60s 70s playlist", ["northern soul", "uk"]),
  entry("UK Folk", "Nick Drake, Pentangle, Fairport Convention — pastoral", "genre", "Nick Drake Fairport Convention UK folk pastoral playlist", ["uk folk", "british folk"]),
  entry("British Electronic", "Aphex Twin, Boards of Canada, Autechre", "genre", "Aphex Twin Boards of Canada British electronic IDM playlist", ["british electronic", "idm"]),
  entry("UK Jazz", "Ezra Collective, Nubya Garcia, Moses Boyd — new wave", "genre", "Ezra Collective Nubya Garcia Moses Boyd UK jazz playlist", ["uk jazz", "british jazz"]),
  entry("British Post-Punk", "Joy Division, The Cure, Gang of Four", "genre", "Joy Division The Cure Gang of Four post-punk British playlist", ["british post-punk"]),
  entry("Shoegaze UK", "My Bloody Valentine, Slowdive, Ride — the dream", "genre", "My Bloody Valentine Slowdive Ride shoegaze UK playlist", ["shoegaze", "uk"]),
  entry("British Punk", "Sex Pistols, The Clash, The Damned — 1977", "genre", "Sex Pistols The Clash Damned British punk 1977 playlist", ["british punk"]),
  entry("London Club", "Fabric, Ministry of Sound — UK dance institution", "genre", "London club music UK dance house techno playlist", ["london club", "uk dance"]),
  entry("UK Bass Music", "Burial, FKA Twigs, James Blake — post-dubstep", "genre", "Burial James Blake FKA Twigs UK bass music playlist", ["uk bass", "post-dubstep"]),
  entry("Britpop Now", "Wet Leg, Yard Act, Dry Cleaning — 2020s revival", "genre", "Wet Leg Yard Act Dry Cleaning British indie 2020s playlist", ["britpop revival", "modern uk"]),
];

// ─── World Music ──────────────────────────────────────────────────────────────

const WORLD: CatalogEntry[] = [
  // South Asia
  entry("Bollywood Classics", "Hindi film music — golden era melodrama", "genre", "Bollywood classic Hindi film songs golden era playlist", ["bollywood", "hindi"]),
  entry("Bollywood Now", "A.R. Rahman era and 2020s Hindi hits", "genre", "AR Rahman Bollywood modern Hindi film songs playlist", ["bollywood", "modern"]),
  entry("Punjabi Bhangra", "Dhol and dholak — wedding and harvest energy", "genre", "Punjabi Bhangra dholak wedding dance music playlist", ["bhangra", "punjabi"]),
  entry("Desi Hip-Hop", "Badshah, Divine, Raftaar — Indian rap", "genre", "Badshah Divine Raftaar Indian hip hop desi rap playlist", ["desi hip hop", "india"]),
  entry("Qawwali", "Nusrat Fateh Ali Khan — Sufi devotional power", "genre", "Nusrat Fateh Ali Khan Qawwali Sufi devotional playlist", ["qawwali", "sufi"]),
  entry("Indian Classical", "Raga and rhythm — Hindustani tradition", "genre", "Ravi Shankar Indian classical sitar Hindustani playlist", ["indian classical", "raga"]),

  // Middle East & North Africa
  entry("Arabic Pop", "Fairuz, Amr Diab, Nancy Ajram — pan-Arab melody", "genre", "Fairuz Amr Diab Nancy Ajram Arabic pop playlist", ["arabic pop", "arab"]),
  entry("Turkish Pop", "Tarkan, Sezen Aksu — Istanbul chart sound", "genre", "Tarkan Sezen Aksu Turkish pop Istanbul playlist", ["turkish pop"]),
  entry("Turkish Psychedelic", "70s Anatolian rock — Erkin Koray, Barış Manço", "genre", "Erkin Koray Baris Manco Anatolian psychedelic rock 70s", ["turkish psychedelic", "anatolian rock"]),
  entry("Persian Pop", "Iranian diaspora pop — pre and post revolution", "genre", "Persian pop Iranian diaspora music playlist", ["persian pop", "iran"]),
  entry("Israeli Music", "Mediterranean meets Middle East pop", "genre", "Israeli music Mizrahi pop Mediterranean playlist", ["israel", "mizrahi"]),

  // Europe
  entry("Flamenco", "Paco de Lucía — Andalusian soul and fury", "genre", "Flamenco Paco de Lucia Camarón de la Isla Spain playlist", ["flamenco", "spain"]),
  entry("Spanish Pop", "Rosalía, C Tangana — nuevo canción español", "genre", "Rosalia C Tangana Spanish pop modern playlist", ["spanish pop"]),
  entry("French Chanson", "Édith Piaf, Serge Gainsbourg — Parisian elegance", "genre", "Edith Piaf Serge Gainsbourg Jacques Brel chanson française", ["chanson", "french"]),
  entry("Greek Laïkó", "Rebetiko and popular Greek song", "genre", "Greek laiko rebetiko Stelios Kazantzidis playlist", ["greek", "laiko"]),
  entry("Fado", "Portuguese longing — saudade in song", "genre", "Fado Amalia Rodrigues Portugal saudade playlist", ["fado", "portugal"]),
  entry("Balkan Beats", "Brass, accordion, and relentless energy", "genre", "Balkan beats brass band Emir Kusturica playlist", ["balkan", "brass"]),
  entry("Scandinavian Pop", "ABBA lineage — Nordic pure pop craft", "genre", "Scandinavian pop Nordic ABBA heritage playlist", ["scandinavian", "nordic pop"]),
  entry("German Electronic", "Kraftwerk, Tangerine Dream — kosmische musik", "genre", "Kraftwerk Tangerine Dream German electronic Krautrock", ["german electronic", "kosmische"]),
  entry("Italian Classics", "Dean Martin era and cantautore", "genre", "Italian classics Ennio Morricone cantautore pop playlist", ["italian", "cantautore"]),

  // Latin America
  entry("Brazilian MPB", "Caetano Veloso, Gilberto Gil — tropical soul", "genre", "Caetano Veloso Gilberto Gil MPB Brazilian music playlist", ["mpb", "brazil"]),
  entry("Baile Funk", "Favela bass — Rio Funk Carioca", "genre", "Baile Funk Funk Carioca Rio de Janeiro playlist", ["baile funk", "brazil"]),
  entry("Forró", "Northeast Brazil accordion dance", "genre", "Forro Brazilian northeast accordion Luiz Gonzaga playlist", ["forro", "brazil"]),
  entry("Cumbia Colombia", "Original Colombian coastal cumbia groove", "genre", "cumbia Colombia Carlos Vives traditional playlist", ["cumbia", "colombia"]),
  entry("Vallenato", "Accordion and story — Carlos Vives heartland", "genre", "Vallenato Carlos Vives Carlos Negrete Colombia playlist", ["vallenato", "colombia"]),
  entry("Mexican Norteño", "Border corrido and accordion narco ballad", "genre", "Norteno Mexico accordion corrido Los Tigres del Norte", ["norteño", "mexico"]),
  entry("Mexican Rock", "Café Tacvba, Caifanes — Latin alt rock", "genre", "Cafe Tacvba Caifanes Mexican rock alternative playlist", ["mexican rock"]),
  entry("Soca", "Trinidad carnival energy — jump and wave", "genre", "Soca Trinidad carnival Machel Montano playlist", ["soca", "trinidad"]),
  entry("Calypso", "Calypsonian wit and political steel pan", "genre", "Calypso steel pan Caribbean Trinidad Lord Kitchener", ["calypso", "caribbean"]),

  // East & Southeast Asia
  entry("Mandopop", "Mandarin Chinese pop — Jay Chou era and beyond", "genre", "Jay Chou Mandopop Mandarin Chinese pop playlist", ["mandopop", "taiwan"]),
  entry("Cantopop", "Hong Kong Cantonese pop golden age", "genre", "Cantopop Hong Kong Cantonese Leslie Cheung playlist", ["cantopop", "hong kong"]),
  entry("Thai Pop", "T-Pop — Bangkok indie and mainstream", "genre", "Thai pop T-pop Bangkok playlist modern Thailand", ["thai pop", "thailand"]),
  entry("Vietnamese Pop", "V-Pop — Hanoi and Ho Chi Minh City sound", "genre", "Vietnamese pop V-pop playlist modern Vietnam", ["v-pop", "vietnam"]),
  entry("Indonesian Pop", "Indie Jakarta and pop Indonesia", "genre", "Indonesian pop indie Jakarta Isyana Sarasvati playlist", ["indonesian pop", "indonesia"]),
  entry("OPM Philippines", "Original Pilipino Music — Manila soul", "genre", "OPM Philippines Filipino music Ben&Ben playlist", ["opm", "philippines"]),
];

// ─── Regional / City Scenes ───────────────────────────────────────────────────

const REGIONAL: CatalogEntry[] = [
  entry("NYC Underground", "Brooklyn and Manhattan after hours", "vibe", "new york city music playlist", ["nyc", "new york"]),
  entry("LA Vibes", "West Coast sun and sprawl", "vibe", "los angeles music playlist", ["la", "los angeles"]),
  entry("Chicago Sound", "Blues, house, and wind", "vibe", "chicago music playlist", ["chicago"]),
  entry("Detroit Techno", "Factory rhythm, industrial soul", "genre", "detroit techno playlist", ["detroit", "techno"]),
  entry("London Sound", "From Bowie to grime", "vibe", "london music playlist", ["london", "uk"]),
  entry("Berlin Electronic", "Club Berghain and beyond", "genre", "berlin electronic playlist", ["berlin", "techno"]),
  entry("Paris Cafe", "Chanson and café jazz", "vibe", "paris cafe music playlist", ["paris", "french"]),
  entry("French Electronic", "Daft Punk and Air legacy", "genre", "french electronic playlist", ["french electronic"]),
  entry("Tokyo City Pop", "Bubble-era Japanese glamour", "genre", "tokyo city pop playlist", ["tokyo", "city pop"]),
  entry("Seoul Indie", "Han River coffee shop sound", "vibe", "seoul indie kpop playlist", ["seoul", "korean"]),
  entry("Lagos Afrobeats", "West African export capital", "genre", "lagos afrobeats playlist", ["lagos", "afrobeats"]),
  entry("Johannesburg Amapiano", "Log drum from Soweto", "genre", "johannesburg amapiano playlist", ["johannesburg", "amapiano"]),
  entry("Cape Town Jazz", "Abdullah Ibrahim and the Cape sound", "genre", "Cape Town jazz Abdullah Ibrahim South Africa playlist", ["cape town", "jazz"]),
  entry("Accra Bounce", "Ghana's new musical capital", "genre", "Accra Ghana music new wave playlist", ["accra", "ghana"]),
  entry("Nairobi Gengetone", "East African street rap", "genre", "Nairobi Kenya gengetone street music playlist", ["nairobi", "kenya"]),
  entry("Addis Ababa Jazz", "Ethiopian jazz from the source", "genre", "Addis Ababa Ethiopian jazz Ethio playlist", ["addis ababa", "ethiopia"]),
  entry("Rio De Janeiro", "Samba, bossa nova, and baile funk", "vibe", "Rio de Janeiro music samba bossa playlist", ["rio", "brazil"]),
  entry("Kingston Reggae", "Root and riddim from the source", "genre", "kingston reggae playlist", ["kingston", "jamaica"]),
  entry("Havana Salsa", "Cuban heat and brass", "genre", "havana salsa playlist", ["havana", "cuba"]),
  entry("Nordic Noir", "Icelandic post-rock and Scandinavian cold", "vibe", "nordic noir playlist", ["nordic", "scandinavia"]),
  entry("Australian Indie", "Sun-bleached and unpretentious", "genre", "australian indie playlist", ["australian", "indie"]),
  entry("Glasgow Sound", "Post-punk and shoegaze — Scotland's best", "vibe", "glasgow indie playlist", ["glasgow", "uk indie"]),
  entry("Manchester Anthems", "Madchester to now", "vibe", "manchester music playlist", ["manchester", "uk"]),
  entry("Mumbai Streets", "Bollywood meets street rap — Maximum City", "vibe", "Mumbai music Hindi street rap Bollywood playlist", ["mumbai", "india"]),
  entry("Istanbul Crossroads", "East meets West — Turkish music capital", "vibe", "Istanbul Turkish music crossroads playlist", ["istanbul", "turkey"]),
  entry("Buenos Aires Tango", "The original passion — Piazzolla and beyond", "genre", "Tango Buenos Aires Piazzolla Argentina playlist", ["tango", "argentina"]),
];

// ─── Special Collections ──────────────────────────────────────────────────────

const SPECIAL: CatalogEntry[] = [
  entry("Midnight Roadtrip", "Driving away from everything", "vibe", "midnight road trip playlist", ["midnight", "drive"]),
  entry("Window Seat", "Watching the world move by", "vibe", "window seat songs playlist", ["travel", "reflective"]),
  entry("90s HipHop", "Boom bap from the golden age", "genre", "90s hip hop essentials", ["90s", "hip hop"]),
  entry("Blog Era Indie", "2007-2012 blog-rock canon", "era", "blog era indie playlist", ["blog era", "indie"]),
  entry("Velvet Weather", "Grey sky, warm room", "vibe", "velvet weather chill playlist", ["chill", "cozy"]),
  entry("Soft Landing", "Gentle transition", "vibe", "soft landing chill playlist", ["soft", "gentle"]),
  entry("Moonlit Disco", "After the club, after midnight", "vibe", "moonlit disco playlist", ["disco", "late night"]),
  entry("Soul Revival", "Neo-soul and classic soul together", "genre", "soul revival playlist", ["soul", "neo soul"]),
  entry("Jazz House", "Jazz chords, club tempo", "genre", "jazz house playlist", ["jazz", "house"]),
  entry("Piano Bar", "Keys and cocktails", "vibe", "piano bar songs playlist", ["piano", "jazz"]),
  entry("Late Night Radio", "3am dial-in frequency", "vibe", "late night radio songs playlist", ["late night"]),
  entry("Heartbreak Classics", "The greatest songs about loss", "mood", "heartbreak classic songs playlist", ["heartbreak", "classic"]),
  entry("Summer Anthems", "Peak season, peak volume", "vibe", "summer anthems playlist", ["summer", "anthems"]),
  entry("Driving Anthems", "Motorway volume and motion", "vibe", "driving anthems playlist", ["driving", "anthems"]),
  entry("Workout Anthems", "The tracks that make you push", "vibe", "workout anthems playlist", ["workout", "anthems"]),
  entry("Karaoke Classics", "Know every word", "vibe", "karaoke songs playlist", ["karaoke"]),
  entry("One-Hit Wonders", "That one perfect moment", "vibe", "one hit wonders playlist", ["one hit wonder"]),
  entry("Deep Cuts", "Beneath the surface of every genre", "vibe", "deep cuts underrated songs playlist", ["deep cuts"]),
  entry("Guilty Pleasures", "Judgement-free listening", "vibe", "guilty pleasure songs playlist", ["guilty pleasure"]),
  entry("90s R&B", "Slow jams and harmony groups", "era", "90s r&b playlist", ["90s r&b"]),
  entry("2000s Emo", "Eyeliner and catharsis", "era", "2000s emo playlist", ["emo", "2000s"]),
  entry("Garage Bands", "Scrappy, raw, real", "genre", "garage bands rock playlist", ["garage rock"]),
  entry("Post-Punk Wire", "Tension and abstraction", "genre", "post punk essentials playlist", ["post punk"]),
  entry("Bossa Nights", "Brazilian soft-lit sway", "genre", "bossa nova nights playlist", ["bossa nova"]),
  entry("Shoegaze Signals", "Reverb wall transmissions", "genre", "shoegaze essentials playlist", ["shoegaze"]),
  entry("Ambient Drift", "Pure atmosphere, no destination", "genre", "ambient drift playlist", ["ambient"]),
  entry("Trip-Hop", "Bristol bass and broken beats", "genre", "trip hop playlist", ["trip hop"]),
  entry("Darkwave", "Gothic electronics and cold synths", "genre", "darkwave playlist", ["darkwave"]),
  entry("Lo-Fi Beats", "Dusty loops for work and study", "genre", "lofi beats study playlist", ["lofi"]),
  entry("Backyard Static", "Loose guitars and warm-weather fuzz", "genre", "indie rock summer backyard playlist", ["indie", "summer"]),
  entry("World Music Essentials", "One playlist, every continent", "genre", "world music essential playlist global", ["world music"]),
  entry("Diaspora Sounds", "Identity, distance, and home frequencies", "vibe", "diaspora music playlist immigrant songs identity", ["diaspora"]),
  entry("Global Club", "Dancefloors from Lagos to Berlin to Tokyo", "vibe", "global club music international dance playlist", ["global", "club"]),
];

// ─── Export ───────────────────────────────────────────────────────────────────

function dedupe(entries: CatalogEntry[]): CatalogEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    if (seen.has(e.slug)) return false;
    seen.add(e.slug);
    return true;
  });
}

export const GENERATED_CATALOG: CatalogEntry[] = dedupe([
  ...MOODS,
  ...GENRES,
  ...ERAS,
  ...ACTIVITIES,
  ...SCENES,
  ...AFRICAN,
  ...BRITISH,
  ...WORLD,
  ...REGIONAL,
  ...SPECIAL,
]);
