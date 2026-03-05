"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useSession } from "next-auth/react";

interface ApprovalMeterProps {
    artistName: string;
    /** compact mode for similar cards — just shows % if votes exist */
    compact?: boolean;
    onAuthRequired?: () => void;
}

interface VoteData {
    up: number;
    down: number;
    total: number;
    approval: number;
    userVote: number;
}

export default function ApprovalMeter({ artistName, compact = false, onAuthRequired }: ApprovalMeterProps) {
    const { data: session } = useSession();
    const [voteData, setVoteData] = useState<VoteData | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    useEffect(() => {
        if (!artistName) return;
        fetch(`/api/votes?artistId=${encodeURIComponent(artistName)}`)
            .then(res => res.json())
            .then(data => {
                if (data.total !== undefined) setVoteData(data);
            })
            .catch(() => { });
    }, [artistName]);

    const handleVote = async (vote: number) => {
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

            // Remove old vote
            if (oldVote === 1) up--;
            if (oldVote === -1) down--;

            // Add new vote
            if (newVote === 1) up++;
            if (newVote === -1) down++;

            const total = up + down;
            setVoteData({
                up,
                down,
                total,
                approval: total > 0 ? Math.round((up / total) * 100) : 0,
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
            // Revert on error by refetching
            fetch(`/api/votes?artistId=${encodeURIComponent(artistName)}`)
                .then(res => res.json())
                .then(data => { if (data.total !== undefined) setVoteData(data); })
                .catch(() => { });
        } finally {
            setIsVoting(false);
        }
    };

    // Compact mode: just a tiny approval badge (for similar artist cards)
    if (compact) {
        if (!voteData || voteData.total === 0) return null;
        return (
            <span
                className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 border"
                style={{
                    color: voteData.approval >= 70 ? "rgba(34,197,94,0.7)" :
                        voteData.approval >= 40 ? "rgba(234,179,8,0.6)" :
                            "rgba(239,68,68,0.6)",
                    borderColor: voteData.approval >= 70 ? "rgba(34,197,94,0.15)" :
                        voteData.approval >= 40 ? "rgba(234,179,8,0.15)" :
                            "rgba(239,68,68,0.15)",
                    backgroundColor: voteData.approval >= 70 ? "rgba(34,197,94,0.05)" :
                        voteData.approval >= 40 ? "rgba(234,179,8,0.05)" :
                            "rgba(239,68,68,0.05)",
                }}
            >
                {voteData.approval}%
            </span>
        );
    }

    // Full mode: for the artist hero section
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleVote(1)}
                disabled={isVoting}
                className={`flex items-center justify-center w-8 h-8 border transition-all duration-200 ${voteData?.userVote === 1
                        ? "border-green-500/50 bg-green-500/20 text-green-400 scale-110"
                        : "border-shift5-dark/20 bg-shift5-dark/5 text-shift5-dark/40 hover:text-green-500 hover:border-green-500/30 hover:bg-green-500/10"
                    }`}
                title="Thumbs up"
            >
                <ThumbsUp size={14} className={voteData?.userVote === 1 ? "fill-current" : ""} />
            </button>

            {voteData && voteData.total > 0 ? (
                <div className="flex items-center gap-1.5 px-2 py-1 border border-shift5-dark/10 bg-shift5-dark/5">
                    <span
                        className="text-[12px] font-mono font-bold"
                        style={{
                            color: voteData.approval >= 70 ? "rgba(34,197,94,0.9)" :
                                voteData.approval >= 40 ? "rgba(180,130,10,0.9)" :
                                    "rgba(220,60,60,0.9)",
                        }}
                    >
                        {voteData.approval}%
                    </span>
                    <span className="text-[9px] font-mono text-shift5-dark/30 uppercase">
                        ({voteData.total})
                    </span>
                </div>
            ) : (
                <div className="px-2 py-1">
                    <span className="text-[9px] font-mono text-shift5-dark/20 uppercase tracking-wider">
                        No_Votes
                    </span>
                </div>
            )}

            <button
                onClick={() => handleVote(-1)}
                disabled={isVoting}
                className={`flex items-center justify-center w-8 h-8 border transition-all duration-200 ${voteData?.userVote === -1
                        ? "border-red-400/50 bg-red-500/20 text-red-400 scale-110"
                        : "border-shift5-dark/20 bg-shift5-dark/5 text-shift5-dark/40 hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/10"
                    }`}
                title="Thumbs down"
            >
                <ThumbsDown size={14} className={voteData?.userVote === -1 ? "fill-current" : ""} />
            </button>
        </div>
    );
}
