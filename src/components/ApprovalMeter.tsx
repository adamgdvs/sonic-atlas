"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useSession } from "next-auth/react";

interface ApprovalMeterProps {
    artistName: string;
    /** inline mode for similar cards — smaller buttons in a row */
    inline?: boolean;
    /** If provided, uses this data instead of fetching */
    initialData?: VoteData | null;
    onAuthRequired?: () => void;
}

interface VoteData {
    up: number;
    down: number;
    total: number;
    approval: number;
    userVote: number;
}

export default function ApprovalMeter({ artistName, inline = false, initialData, onAuthRequired }: ApprovalMeterProps) {
    const { data: session } = useSession();
    const [voteData, setVoteData] = useState<VoteData | null>(initialData || null);
    const [isVoting, setIsVoting] = useState(false);

    // Fetch vote data if not provided
    useEffect(() => {
        if (initialData !== undefined) {
            setVoteData(initialData);
            return;
        }
        if (!artistName) return;
        fetch(`/api/votes?artistId=${encodeURIComponent(artistName)}`)
            .then(res => res.json())
            .then(data => {
                if (data.total !== undefined) setVoteData(data);
            })
            .catch(() => { });
    }, [artistName, initialData]);

    const handleVote = async (e: React.MouseEvent, vote: number) => {
        e.stopPropagation(); // prevent card clicks
        if (!session?.user) {
            onAuthRequired?.();
            return;
        }

        if (isVoting) return;
        setIsVoting(true);

        // Toggle: if clicking same vote, remove it (send 0)
        const newVote = voteData?.userVote === vote ? 0 : vote;

        // Optimistic update
        if (voteData) {
            const oldVote = voteData.userVote;
            let { up, down } = voteData;
            if (oldVote === 1) up--;
            if (oldVote === -1) down--;
            if (newVote === 1) up++;
            if (newVote === -1) down++;
            const total = up + down;
            setVoteData({
                up, down, total,
                approval: total > 0 ? Math.round((up / total) * 100) : 0,
                userVote: newVote,
            });
        } else {
            setVoteData({
                up: newVote === 1 ? 1 : 0,
                down: newVote === -1 ? 1 : 0,
                total: 1,
                approval: newVote === 1 ? 100 : 0,
                userVote: newVote,
            });
        }

        try {
            const res = await fetch("/api/votes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artistId: artistName, vote: newVote }),
            });
            if (res.ok) {
                const data = await res.json();
                setVoteData(data);
            }
        } catch {
            fetch(`/api/votes?artistId=${encodeURIComponent(artistName)}`)
                .then(res => res.json())
                .then(data => { if (data.total !== undefined) setVoteData(data); })
                .catch(() => { });
        } finally {
            setIsVoting(false);
        }
    };

    const hasVotes = voteData && voteData.total > 0;
    const approvalColor = !hasVotes ? undefined :
        voteData.approval >= 70 ? "rgb(34,197,94)" :
            voteData.approval >= 40 ? "rgb(234,179,8)" :
                "rgb(239,68,68)";

    // ─── Inline mode: for similar artist cards ──────────────────
    if (inline) {
        return (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                    onClick={(e) => handleVote(e, 1)}
                    disabled={isVoting}
                    className={`flex items-center justify-center w-7 h-7 border transition-all duration-200 cursor-pointer ${voteData?.userVote === 1
                        ? "border-green-500/40 bg-green-500/15 text-green-400"
                        : "border-white/10 bg-white/5 text-white/25 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10"
                        }`}
                    title="Thumbs up"
                >
                    <ThumbsUp size={11} className={voteData?.userVote === 1 ? "fill-current" : ""} />
                </button>

                {hasVotes && (
                    <span
                        className="text-[9px] font-mono font-bold px-1 min-w-[28px] text-center"
                        style={{ color: approvalColor }}
                    >
                        {voteData.approval}%
                    </span>
                )}

                <button
                    onClick={(e) => handleVote(e, -1)}
                    disabled={isVoting}
                    className={`flex items-center justify-center w-7 h-7 border transition-all duration-200 cursor-pointer ${voteData?.userVote === -1
                        ? "border-red-400/40 bg-red-500/15 text-red-400"
                        : "border-white/10 bg-white/5 text-white/25 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10"
                        }`}
                    title="Thumbs down"
                >
                    <ThumbsDown size={11} className={voteData?.userVote === -1 ? "fill-current" : ""} />
                </button>
            </div>
        );
    }

    // ─── Full mode: for the artist hero section (on orange bg) ──
    return (
        <div className="flex items-center gap-2 w-full">
            <button
                onClick={(e) => handleVote(e, 1)}
                disabled={isVoting}
                className={`flex-1 flex items-center justify-center py-3 border-2 transition-all duration-200 cursor-pointer ${voteData?.userVote === 1
                        ? "border-green-600 bg-green-600/30 text-green-800 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                        : "border-shift5-dark/30 bg-shift5-dark/10 text-shift5-dark/60 hover:text-green-700 hover:border-green-600/50 hover:bg-green-500/20"
                    }`}
                title="Thumbs up"
            >
                <ThumbsUp size={16} className={voteData?.userVote === 1 ? "fill-current" : ""} />
            </button>

            <div className="flex items-center justify-center min-w-[60px]">
                {hasVotes ? (
                    <span
                        className="text-[13px] font-mono font-black flex items-center gap-1"
                        style={{
                            color: voteData.approval >= 90 ? "#166534" :
                                voteData.approval >= 60 ? "#854d0e" :
                                    "#991b1b",
                        }}
                    >
                        {voteData.approval}%
                        <span className="text-[9px] font-mono text-shift5-dark/40 font-bold">({voteData.total})</span>
                    </span>
                ) : (
                    <span className="text-[9px] font-mono text-shift5-dark/30 uppercase tracking-wider font-bold">
                        No_Votes
                    </span>
                )}
            </div>

            <button
                onClick={(e) => handleVote(e, -1)}
                disabled={isVoting}
                className={`flex-1 flex items-center justify-center py-3 border-2 transition-all duration-200 cursor-pointer ${voteData?.userVote === -1
                        ? "border-red-700 bg-red-700/30 text-red-900 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                        : "border-shift5-dark/30 bg-shift5-dark/10 text-shift5-dark/60 hover:text-red-800 hover:border-red-700/50 hover:bg-red-500/20"
                    }`}
                title="Thumbs down"
            >
                <ThumbsDown size={16} className={voteData?.userVote === -1 ? "fill-current" : ""} />
            </button>
        </div>
    );
}
