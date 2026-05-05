"use client";

import { useState } from "react";
import type { useTipMyst } from "~~/hooks/tipmyst/useTipMyst";

type Props = {
  creatorAddresses: `0x${string}`[];
  sendTip: ReturnType<typeof useTipMyst>["sendTip"];
  isProcessing: boolean;
  isEncrypting: boolean;
};

export function SendTipCard({ creatorAddresses, sendTip, isProcessing, isEncrypting }: Props) {
  const [recipient, setRecipient] = useState<`0x${string}` | "">("");
  const [amount, setAmount] = useState("");
  const [sent, setSent] = useState(false);

  const canSend = Boolean(recipient && amount && Number(amount) > 0 && !isProcessing && !isEncrypting);

  const handleSend = async () => {
    if (!canSend || !recipient) return;
    await sendTip(recipient, Number(amount));
    setSent(true);
    setAmount("");
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="bg-white shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Send Encrypted Tip</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Creator</label>
          {creatorAddresses.length > 0 ? (
            <select
              value={recipient}
              onChange={e => setRecipient(e.target.value as `0x${string}`)}
              className="w-full border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFD208]"
            >
              <option value="">Select a creator…</option>
              {creatorAddresses.map(addr => (
                <option key={addr} value={addr}>
                  {addr.slice(0, 6)}…{addr.slice(-4)}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-500 italic">No creators registered yet.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (MYST)</label>
          <input
            type="number"
            min="0.000001"
            step="0.5"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 1.5"
            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FFD208]"
          />
        </div>
      </div>

      <button
        onClick={handleSend}
        disabled={!canSend}
        className="w-full px-4 py-3 bg-[#FFD208] text-[#2D2D2D] font-bold shadow hover:bg-[#e6bd07] disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        {isEncrypting
          ? "🔐 Encrypting amount..."
          : isProcessing
            ? "⏳ Sending tip..."
            : sent
              ? "✅ Tip sent!"
              : "🚀 Send Encrypted Tip"}
      </button>

      <p className="text-xs text-gray-500">
        The tip amount is encrypted client-side before reaching the blockchain — even the contract cannot read it in
        plaintext.
      </p>
    </div>
  );
}
