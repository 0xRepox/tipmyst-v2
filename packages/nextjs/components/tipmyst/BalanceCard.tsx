"use client";

import { useState } from "react";
import type { useTipMyst } from "~~/hooks/tipmyst/useTipMyst";

type Props = Pick<
  ReturnType<typeof useTipMyst>,
  | "balanceHandle"
  | "decryptedBalance"
  | "isBalanceDecrypted"
  | "isDecrypting"
  | "canViewBalance"
  | "viewBalance"
  | "claimFaucet"
  | "refreshBalance"
  | "isProcessing"
>;

function formatMYST(raw: unknown): string {
  return (Number(raw as bigint) / 1_000_000).toFixed(2);
}

// Zero handle = no balance yet (never claimed faucet or balance is 0)
function isZeroHandle(handle: string | undefined): boolean {
  return !handle || /^0x0+$/.test(handle);
}

export function BalanceCard({
  balanceHandle,
  decryptedBalance,
  isBalanceDecrypted,
  isDecrypting,
  canViewBalance,
  viewBalance,
  claimFaucet,
  isProcessing,
}: Props) {
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    await claimFaucet();
    setClaimed(true);
    setTimeout(() => setClaimed(false), 4000);
  };

  const zeroBalance = isZeroHandle(balanceHandle);

  return (
    <div className="premium-card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">My MYST Balance</h2>
        <span className="gold-badge text-xs">Encrypted On-chain</span>
      </div>

      <hr className="gold-divider" />

      {/* Balance display */}
      <div className="text-center py-4">
        {zeroBalance ? (
          <div className="space-y-2">
            <p className="text-5xl font-extrabold gold-gradient-text">0.00</p>
            <p className="text-white/50 text-sm mt-1">MYST</p>
            <p className="text-white/30 text-xs">Claim free MYST to get started →</p>
          </div>
        ) : isBalanceDecrypted ? (
          <>
            <p className="text-5xl font-extrabold gold-gradient-text">{formatMYST(decryptedBalance!)}</p>
            <p className="text-white/50 text-sm mt-1">MYST</p>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-4xl font-extrabold text-white/20">••••••</p>
            <p className="text-white/40 text-sm">Balance hidden — click View Balance to decrypt</p>
          </div>
        )}
      </div>

      {/* Encrypted handle — hide when zero */}
      {!zeroBalance && balanceHandle && (
        <div className="bg-white/[0.03] border border-white/8 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
          <span className="text-xs text-white/40 shrink-0">Handle</span>
          <span className="font-mono text-xs text-white/50 truncate">{balanceHandle.slice(0, 18)}…</span>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={viewBalance}
          disabled={zeroBalance || !canViewBalance || isDecrypting}
          className="gold-button w-full py-3 text-sm"
        >
          {isDecrypting ? (
            <>
              <span className="gold-spinner" />
              Decrypting…
            </>
          ) : isBalanceDecrypted ? (
            "🔄 Re-decrypt"
          ) : (
            "🔓 View Balance"
          )}
        </button>

        <button onClick={handleClaim} disabled={isProcessing} className="blue-button w-full py-3 text-sm">
          {claimed ? "✅ Claimed!" : isProcessing ? "Claiming…" : "💧 Get 10 MYST"}
        </button>
      </div>

      <p className="text-xs text-white/30 text-center">
        Your balance is encrypted on Sepolia. Only your wallet can decrypt it via EIP-712 signature.
      </p>
    </div>
  );
}
