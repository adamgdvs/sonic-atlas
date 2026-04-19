#!/usr/bin/env python3
import json
import sys


def first_thumbnail(item):
    thumbs = item.get("thumbnails") or item.get("thumbnail") or []
    if isinstance(thumbs, dict):
        thumbs = [thumbs]
    for thumb in thumbs:
        url = thumb.get("url")
        if url:
            return url
    return None


def extract_track_count(item):
    # YT Music search results expose the playlist size in a few shapes:
    #   "count": "42 songs"
    #   "itemCount": 42
    #   "trackCount": 42
    for key in ("trackCount", "itemCount", "count"):
        value = item.get(key)
        if value is None:
            continue
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            digits = "".join(ch for ch in value if ch.isdigit())
            if digits:
                try:
                    return int(digits)
                except ValueError:
                    pass
    return None


def normalize_playlist(item, category=None):
    playlist_id = item.get("playlistId") or item.get("browseId")
    if not playlist_id:
        return None

    description = item.get("description")
    if not description:
        artists = item.get("artists") or []
        if artists:
            description = " • ".join(
                artist.get("name", "") for artist in artists if artist.get("name")
            )

    return {
        "id": playlist_id,
        "title": item.get("title") or "Untitled Playlist",
        "description": description or "",
        "coverUrl": first_thumbnail(item),
        "source": "ytmusic",
        "category": category or "curated",
        "trackCount": extract_track_count(item),
    }


def normalize_track(item):
    video_id = item.get("videoId")
    if not video_id:
        return None

    artists = item.get("artists") or []
    artist_names = [artist.get("name", "") for artist in artists if artist.get("name")]

    return {
        "title": item.get("title") or "Untitled Track",
        "artist": ", ".join(artist_names) if artist_names else "Unknown Artist",
        "videoId": video_id,
        "coverUrl": first_thumbnail(item),
    }


def build_client():
    from ytmusicapi import YTMusic

    return YTMusic()


def moods():
    ytmusic = build_client()
    categories = ytmusic.get_mood_categories()
    flattened = []

    for section, items in categories.items():
        if not isinstance(items, list):
            continue
        for item in items:
            params = item.get("params")
            title = item.get("title")
            if not params or not title:
                continue
            flattened.append(
                {
                    "title": title,
                    "params": params,
                    "section": section,
                }
            )

    return flattened


def mood_playlists(params):
    ytmusic = build_client()
    playlists = ytmusic.get_mood_playlists(params)
    normalized = []
    for item in playlists:
        playlist = normalize_playlist(item, "mood")
        if playlist:
            normalized.append(playlist)
    return normalized


def charts(country):
    ytmusic = build_client()
    chart_data = ytmusic.get_charts(country)

    def normalize_chart_block(block_name):
        block = chart_data.get(block_name) or {}
        results = block.get("results") or []
        normalized = []
        for item in results:
            track = normalize_track(item)
            if track:
                normalized.append(track)
        return normalized

    return {
        "country": country,
        "videos": normalize_chart_block("videos"),
        "songs": normalize_chart_block("songs"),
        "artists": [
            {
                "name": item.get("title") or "Unknown Artist",
                "coverUrl": first_thumbnail(item),
            }
            for item in (chart_data.get("artists") or {}).get("results", [])
            if item.get("title")
        ],
    }


def playlist_tracks(playlist_id):
    ytmusic = build_client()
    playlist = ytmusic.get_playlist(playlist_id, limit=100)
    tracks = []
    for item in playlist.get("tracks") or []:
        track = normalize_track(item)
        if track:
            tracks.append(track)

    return {
        "id": playlist_id,
        "title": playlist.get("title") or "Untitled Playlist",
        "description": playlist.get("description") or "",
        "coverUrl": first_thumbnail(playlist),
        "source": "ytmusic",
        "category": "curated",
        "trackCount": len(tracks),
        "tracks": tracks,
    }


def search_playlists(query):
    ytmusic = build_client()
    results = ytmusic.search(query, filter="playlists", limit=12)
    normalized = []
    for item in results:
      playlist = normalize_playlist(item, "genre")
      if playlist:
          normalized.append(playlist)
    return normalized


def main():
    try:
        command = sys.argv[1]
    except IndexError:
        print(json.dumps({"error": "missing command"}))
        return 1

    try:
        if command == "moods":
            payload = moods()
        elif command == "mood_playlists":
            payload = mood_playlists(sys.argv[2])
        elif command == "charts":
            payload = charts(sys.argv[2] if len(sys.argv) > 2 else "US")
        elif command == "playlist_tracks":
            payload = playlist_tracks(sys.argv[2])
        elif command == "search_playlists":
            payload = search_playlists(sys.argv[2])
        else:
            print(json.dumps({"error": f"unknown command: {command}"}))
            return 1
    except ImportError as exc:
        print(
            json.dumps(
                {
                    "error": "ytmusicapi not installed",
                    "detail": str(exc),
                }
            )
        )
        return 2
    except Exception as exc:
        print(json.dumps({"error": "bridge failure", "detail": str(exc)}))
        return 3

    print(json.dumps(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
