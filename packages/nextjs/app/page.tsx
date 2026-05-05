"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { BalanceCard } from "~~/components/tipmyst/BalanceCard";
import { CreatorList } from "~~/components/tipmyst/CreatorList";
import { RegisterCard } from "~~/components/tipmyst/RegisterCard";
import { useTipMyst } from "~~/hooks/tipmyst/useTipMyst";

type Role = "supporter" | "creator";

/* ─── Background blobs ──────────────────────────────────────────────────── */
function Blobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden>
      <div
        className="float-animation absolute rounded-full opacity-[0.12]"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, #FED10A, transparent 70%)",
          top: "-100px",
          left: "-100px",
        }}
      />
      <div
        className="float-animation absolute rounded-full opacity-[0.10]"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, #6BA292, transparent 70%)",
          bottom: "-80px",
          right: "-80px",
          animationDelay: "-4s",
        }}
      />
    </div>
  );
}

/* ─── Status message bar ────────────────────────────────────────────────── */
function StatusMessage({ message }: { message: string }) {
  if (!message) return null;
  const isError = /failed|error/i.test(message);
  return (
    <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${isError ? "alert-error" : "alert-info"}`}>
      <div className="flex items-center gap-2">
        {!isError && <span className="gold-spinner" />}
        <span>{message}</span>
      </div>
    </div>
  );
}

/* ─── Landing page (not connected) ─────────────────────────────────────── */
function LandingPage() {
  return (
    <div className="relative">
      <Blobs />

      {/* Hero */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="stagger-1 mb-6">
            <span className="gold-badge">Powered by Zama FHEVM · Sepolia Testnet</span>
          </div>

          <h1 className="stagger-2 text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
            Tip Your Favourite
            <br />
            <span className="gold-gradient-text">Creators, Privately.</span>
          </h1>

          <p className="stagger-3 text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            TipMyst encrypts tip amounts on-chain using Fully Homomorphic Encryption. No one — not even the contract —
            can read how much you sent.
          </p>

          <div className="stagger-4 flex justify-center mb-16">
            <RainbowKitCustomConnectButton />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "100%", label: "On-chain Privacy" },
              { value: "FHE", label: "Encrypted Amounts" },
              { value: "0", label: "Data Leaked" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-2xl font-extrabold gold-gradient-text">{s.value}</p>
                <p className="text-xs text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-2">Why TipMyst?</h2>
          <p className="text-center text-white/50 text-sm mb-10">First-of-its-kind private tipping protocol</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🔐",
                title: "FHE Privacy",
                desc: "Tip amounts are encrypted using Zama FHEVM. Arithmetic runs on ciphertext — no one sees values.",
              },
              {
                icon: "⛓️",
                title: "On-chain Tips",
                desc: "Every tip is recorded on Sepolia. Transparent provenance, private amounts — best of both worlds.",
              },
              {
                icon: "💎",
                title: "MYST Token",
                desc: "Use the built-in MYST testnet token. Claim free MYST from the faucet and start tipping instantly.",
              },
            ].map(f => (
              <div key={f.title} className="premium-card premium-card-hover">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-center text-white/50 text-sm mb-10">Four steps to private, on-chain tipping</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { n: "01", title: "Connect Wallet", desc: "Connect MetaMask or any Web3 wallet to Sepolia testnet." },
              {
                n: "02",
                title: "Choose Your Role",
                desc: "Are you a supporter wanting to tip, or a creator to receive?",
              },
              {
                n: "03",
                title: "Encrypt Your Tip",
                desc: "The FHEVM library encrypts your amount in the browser before signing.",
              },
              {
                n: "04",
                title: "Send Privately",
                desc: "The encrypted tip hits the smart contract. Only you know how much you sent.",
              },
            ].map(s => (
              <div key={s.n} className="premium-card flex items-start gap-4">
                <span className="gold-gradient-text text-3xl font-extrabold leading-none shrink-0">{s.n}</span>
                <div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-extrabold mb-4">
            Ready to tip <span className="gold-gradient-text">privately?</span>
          </h2>
          <p className="text-white/50 mb-8 text-sm">Connect your wallet to get started. It&apos;s free on Sepolia.</p>
          <div className="flex justify-center">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Role selector ─────────────────────────────────────────────────────── */
function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-white mb-2">Choose Your Role</h2>
        <p className="text-white/50">How would you like to use TipMyst today?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <button
          onClick={() => onSelect("supporter")}
          className="premium-card premium-card-hover text-left cursor-pointer transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-1">
            <span className="gold-gradient-text">Supporter</span>
          </h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Browse registered creators and send privately encrypted tips. Only you know how much you sent.
          </p>
          <div className="mt-4">
            <span className="gold-badge text-xs">Send Tips · View Balance · Faucet</span>
          </div>
        </button>

        <button
          onClick={() => onSelect("creator")}
          className="premium-card premium-card-hover text-left cursor-pointer transition-all hover:scale-[1.02]"
        >
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-xl font-bold mb-1 teal-text">Creator</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Register your creator profile. Supporters can find you and send encrypted tips directly to your wallet.
          </p>
          <div className="mt-4">
            <span className="blue-badge text-xs">Register Profile · Receive Tips · View Balance</span>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── App shell (post-role selection) ──────────────────────────────────── */
function AppShell({ role, onSwitchRole }: { role: Role; onSwitchRole: () => void }) {
  const tm = useTipMyst();
  const { address } = useAccount();

  const isRegisteredCreator = useMemo(
    () => (address ? tm.creatorAddresses.some(a => a.toLowerCase() === address.toLowerCase()) : false),
    [address, tm.creatorAddresses],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Role bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {role === "supporter" ? (
            <span className="gold-badge">💎 Supporter View</span>
          ) : (
            <span className="blue-badge">🎨 Creator View</span>
          )}
        </div>
        <button onClick={onSwitchRole} className="outline-gold-button text-xs px-3 py-1.5">
          Switch Role
        </button>
      </div>

      <StatusMessage message={tm.message} />

      {role === "supporter" ? (
        <div className="space-y-6">
          <BalanceCard
            balanceHandle={tm.balanceHandle}
            decryptedBalance={tm.decryptedBalance}
            isBalanceDecrypted={tm.isBalanceDecrypted}
            isDecrypting={tm.isDecrypting}
            canViewBalance={tm.canViewBalance}
            viewBalance={tm.viewBalance}
            claimFaucet={tm.claimFaucet}
            refreshBalance={tm.refreshBalance}
            isProcessing={tm.isProcessing}
          />
          <CreatorList
            creatorAddresses={tm.creatorAddresses}
            sendTip={tm.sendTip}
            isProcessing={tm.isProcessing}
            isEncrypting={tm.isEncrypting}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <BalanceCard
            balanceHandle={tm.balanceHandle}
            decryptedBalance={tm.decryptedBalance}
            isBalanceDecrypted={tm.isBalanceDecrypted}
            isDecrypting={tm.isDecrypting}
            canViewBalance={tm.canViewBalance}
            viewBalance={tm.viewBalance}
            claimFaucet={tm.claimFaucet}
            refreshBalance={tm.refreshBalance}
            isProcessing={tm.isProcessing}
          />
          <RegisterCard
            registerCreator={tm.registerCreator}
            isProcessing={tm.isProcessing}
            isRegistered={isRegisteredCreator}
            address={address}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Page root ─────────────────────────────────────────────────────────── */
export default function Home() {
  const { isConnected } = useAccount();
  const [role, setRole] = useState<Role | null>(null);

  if (!isConnected) return <LandingPage />;
  if (!role) return <RoleSelector onSelect={setRole} />;
  return <AppShell role={role} onSwitchRole={() => setRole(null)} />;
}
