"use client";

import { useRef, useState } from "react";
import type { useTipMyst } from "~~/hooks/tipmyst/useTipMyst";

type Props = {
  registerCreator: ReturnType<typeof useTipMyst>["registerCreator"];
  isProcessing: boolean;
  isRegistered: boolean;
  address: `0x${string}` | undefined;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dztd1tlbl";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

function dicebearUrl(seed: string) {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}

/* ── Already-registered card ── */
function RegisteredCard({ address }: { address: `0x${string}` | undefined }) {
  const [copied, setCopied] = useState(false);
  const addr = address ?? "";

  const copy = () => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="premium-card text-center space-y-5">
      <div className="text-5xl">🎉</div>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">You&apos;re a Creator!</h3>
        <p className="text-white/50 text-sm">Share your address so supporters can find and tip you.</p>
      </div>
      <hr className="gold-divider" />
      <div>
        <p className="text-xs text-white/40 mb-2">Your creator address</p>
        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white/70 break-all">
          {addr}
        </div>
      </div>
      <button onClick={copy} className="gold-button w-full py-3 text-sm">
        {copied ? "✅ Copied!" : "📋 Copy Address"}
      </button>
    </div>
  );
}

/* ── Registration form ── */
export function RegisterCard({ registerCreator, isProcessing, isRegistered, address }: Props) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [justRegistered, setJustRegistered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (isRegistered || justRegistered) {
    return <RegisteredCard address={address} />;
  }

  const canRegister = Boolean(name.trim() && !isProcessing && !uploading);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!UPLOAD_PRESET) {
      setUploadError("Image upload not configured. Paste a URL instead.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
    } catch {
      setUploadError("Upload failed. Please paste an image URL manually.");
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async () => {
    if (!canRegister) return;
    await registerCreator(name.trim(), bio.trim(), imageUrl.trim());
    setJustRegistered(true);
  };

  const avatarSrc = imageUrl || (address ? dicebearUrl(address) : dicebearUrl("default"));

  return (
    <div className="premium-card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Become a Creator</h2>
        <span className="blue-badge text-xs">Free Registration</span>
      </div>

      <hr className="gold-divider" />

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <img
            src={avatarSrc}
            alt="Profile avatar"
            className="w-20 h-20 rounded-full border-2 border-[#FED10A]/30 object-cover bg-[#111]"
            onError={e => {
              (e.target as HTMLImageElement).src = dicebearUrl(address ?? "default");
            }}
          />
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <span className="gold-spinner" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="outline-gold-button text-xs px-3 py-1.5"
          >
            {uploading ? "Uploading…" : "Upload Photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        {uploadError && <p className="text-xs text-[#ff583f]">{uploadError}</p>}
      </div>

      {/* Form fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Creator Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your creator name"
            className="premium-input"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell supporters about yourself…"
            rows={3}
            className="premium-textarea"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Profile Image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://… (or upload above)"
            className="premium-input"
          />
        </div>
      </div>

      <button onClick={handleRegister} disabled={!canRegister} className="gold-button w-full py-3 text-sm">
        {isProcessing ? (
          <>
            <span className="gold-spinner" />
            Registering…
          </>
        ) : (
          "🚀 Register as Creator"
        )}
      </button>

      <p className="text-xs text-white/30 text-center">
        Registration is a one-time on-chain transaction. Your profile is stored in the smart contract.
      </p>
    </div>
  );
}
