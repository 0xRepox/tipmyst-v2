"use client";

import { useMemo, useState } from "react";
import { useChainId, useReadContract } from "wagmi";
import { TipMyst } from "~~/contracts/TipMyst";
import { deploymentFor } from "~~/utils/contract";

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
}

type CreatorRowProps = {
  address: `0x${string}`;
  tipMystAddress: `0x${string}`;
  tipMystAbi: readonly unknown[];
  searchQuery: string;
  sendTip: (creator: `0x${string}`, amountMYST: number) => Promise<void>;
  isProcessing: boolean;
  isEncrypting: boolean;
};

function CreatorRow({
  address,
  tipMystAddress,
  tipMystAbi,
  searchQuery,
  sendTip,
  isProcessing,
  isEncrypting,
}: CreatorRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [tipSent, setTipSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data } = useReadContract({
    address: tipMystAddress,
    abi: tipMystAbi as any,
    functionName: "getCreator",
    args: [address],
  });

  const [name, bio, imageUrl, tipCount] = (data as [string, string, string, bigint] | undefined) ?? ["…", "", "", 0n];

  // Filter by search query
  if (searchQuery.length > 0) {
    const q = searchQuery.toLowerCase();
    const matches =
      name.toLowerCase().includes(q) || bio.toLowerCase().includes(q) || address.toLowerCase().includes(q);
    if (!matches) return null;
  }

  const avatarSrc = imageUrl || dicebearUrl(address);

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tipAmount || isProcessing || isEncrypting) return;
    await sendTip(address, Number(tipAmount));
    setTipAmount("");
    setTipSent(true);
    setTimeout(() => {
      setTipSent(false);
      setExpanded(false);
    }, 3000);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canSend = Boolean(tipAmount && Number(tipAmount) > 0 && !isProcessing && !isEncrypting);

  return (
    <div className="premium-card premium-card-hover mb-3">
      {/* Creator header row */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setExpanded(x => !x)}>
        <img
          src={avatarSrc}
          alt={name}
          className="w-11 h-11 rounded-full border border-white/10 object-cover bg-[#1a1a1a] shrink-0"
          onError={e => {
            (e.target as HTMLImageElement).src = dicebearUrl(address);
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{name}</p>
          {bio && <p className="text-xs text-white/50 truncate">{bio}</p>}
          <p className="text-[10px] text-white/30 font-mono mt-0.5">
            {address.slice(0, 6)}…{address.slice(-4)}
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <span className="gold-badge text-[10px] px-2 py-0.5">{tipCount.toString()} tips</span>
          <span className="text-white/30 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Inline tip form */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
          {tipSent ? (
            <div className="alert-success text-center text-sm font-semibold">
              🎉 Tip sent! The amount is encrypted — only they can see it.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Amount (MYST)</label>
                <input
                  type="number"
                  min="0.000001"
                  step="0.5"
                  value={tipAmount}
                  onChange={e => setTipAmount(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="premium-input"
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSend} disabled={!canSend} className="gold-button flex-1 py-2.5 text-sm">
                  {isEncrypting ? (
                    <>
                      <span className="gold-spinner" />
                      Encrypting…
                    </>
                  ) : isProcessing ? (
                    <>
                      <span className="gold-spinner" />
                      Sending…
                    </>
                  ) : (
                    "🚀 Send Tip"
                  )}
                </button>
                <button onClick={handleCopy} className="outline-gold-button px-3 py-2.5 text-xs">
                  {copied ? "✅" : "📋"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

type Props = {
  creatorAddresses: `0x${string}`[];
  sendTip: (creator: `0x${string}`, amountMYST: number) => Promise<void>;
  isProcessing: boolean;
  isEncrypting: boolean;
};

export function CreatorList({ creatorAddresses, sendTip, isProcessing, isEncrypting }: Props) {
  const chainId = useChainId();
  const deployment = useMemo(() => deploymentFor(TipMyst, chainId), [chainId]);
  const [search, setSearch] = useState("");

  if (!deployment?.address) {
    return <div className="alert-warning text-sm">Contract not deployed on this network. Switch to Sepolia.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          Creators{" "}
          {creatorAddresses.length > 0 && (
            <span className="text-white/40 font-normal text-sm">({creatorAddresses.length})</span>
          )}
        </h2>
        <span className="blue-badge text-xs">Click to Tip</span>
      </div>

      {/* Search */}
      {creatorAddresses.length > 1 && (
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, bio or address…"
          className="premium-input"
        />
      )}

      {/* Creator list */}
      {creatorAddresses.length === 0 ? (
        <div className="premium-card text-center py-10">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-white/50 text-sm">No creators registered yet.</p>
          <p className="text-white/30 text-xs mt-1">Switch to Creator role to be the first!</p>
        </div>
      ) : (
        <div className="custom-scrollbar">
          {creatorAddresses.map(addr => (
            <CreatorRow
              key={addr}
              address={addr}
              tipMystAddress={deployment.address}
              tipMystAbi={deployment.abi}
              searchQuery={search}
              sendTip={sendTip}
              isProcessing={isProcessing}
              isEncrypting={isEncrypting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
