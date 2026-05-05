"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Globe, Lock, Send, Shield, Sparkles, UserCheck, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { BalanceCard } from "~~/components/tipmyst/BalanceCard";
import { CreatorList } from "~~/components/tipmyst/CreatorList";
import { RegisterCard } from "~~/components/tipmyst/RegisterCard";
import { useTipMyst } from "~~/hooks/tipmyst/useTipMyst";

type Role = "supporter" | "creator";

/* ─── Ambient background ─────────────────────────────────────────────────── */
function Background() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden>
      {/* Grid */}
      <div className="absolute inset-0 grid-bg opacity-100" />
      {/* Gold blob — top left */}
      <div
        className="float-animation absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          background: "radial-gradient(circle at center, rgba(254,209,10,0.07), transparent 65%)",
          top: "-200px",
          left: "-150px",
        }}
      />
      {/* Teal blob — bottom right */}
      <div
        className="float-animation absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle at center, rgba(107,162,146,0.07), transparent 65%)",
          bottom: "-150px",
          right: "-100px",
          animationDelay: "-5s",
        }}
      />
    </div>
  );
}

/* ─── Status bar ─────────────────────────────────────────────────────────── */
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

/* ─── Landing ────────────────────────────────────────────────────────────── */
function LandingPage() {
  return (
    <div className="relative">
      <Background />

      {/* ── Hero ── */}
      <section className="pt-28 pb-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="stagger-1 mb-8">
            <span className="gold-badge">Zama FHEVM · Sepolia Testnet</span>
          </div>

          <h1 className="stagger-2 font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="block text-5xl sm:text-7xl text-white">Confidential</span>
            <span className="block text-5xl sm:text-7xl text-white">Creator Tipping</span>
            <span className="block text-5xl sm:text-7xl gold-gradient-text">On-chain.</span>
          </h1>

          <p className="stagger-3 text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-12">
            Tip amounts are encrypted client-side using Fully Homomorphic Encryption before hitting the blockchain — the
            contract processes ciphertext, no one sees plaintext values.
          </p>

          <div className="stagger-4 flex justify-center mb-20">
            <div className="pulse-cta rounded-xl">
              <RainbowKitCustomConnectButton />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {[
              { value: "FHE", label: "Encryption" },
              { value: "100%", label: "Private Amounts" },
              { value: "0", label: "Leaks" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <p className="text-xl font-extrabold gold-gradient-text">{s.value}</p>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label">Features</span>
            <h2 className="text-3xl font-extrabold text-white">Built different.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Shield size={22} />,
                iconClass: "feature-icon-gold",
                title: "FHE Privacy",
                desc: "Tip amounts are encrypted using Zama FHEVM. The smart contract performs arithmetic on ciphertext — no plaintext ever touches the chain.",
              },
              {
                icon: <Globe size={22} />,
                iconClass: "feature-icon-teal",
                title: "On-chain Provenance",
                desc: "Every tip is permanently recorded on Ethereum Sepolia. Transparent history, private amounts — the best of both worlds.",
              },
              {
                icon: <Sparkles size={22} />,
                iconClass: "feature-icon-purple",
                title: "MYST Token",
                desc: "Built-in confidential ERC-20 token. Claim free MYST from the faucet and start tipping instantly. Balances are encrypted too.",
              },
            ].map(f => (
              <div key={f.title} className="premium-card premium-card-hover group">
                <div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
                <h3 className="font-bold text-white mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label">How it works</span>
            <h2 className="text-3xl font-extrabold text-white">Four steps to private tipping.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                n: "01",
                icon: <Wallet size={18} />,
                title: "Connect Wallet",
                desc: "Connect MetaMask or any Web3 wallet. Switch to Sepolia testnet.",
              },
              {
                n: "02",
                icon: <UserCheck size={18} />,
                title: "Choose Your Role",
                desc: "Supporter to send tips, or Creator to register your profile and receive them.",
              },
              {
                n: "03",
                icon: <Lock size={18} />,
                title: "Encrypt Your Tip",
                desc: "The Zama SDK encrypts the amount in your browser. The ciphertext is signed and submitted.",
              },
              {
                n: "04",
                icon: <Send size={18} />,
                title: "Send Privately",
                desc: "The contract transfers encrypted MYST. Only the recipient can decrypt their balance.",
              },
            ].map(s => (
              <div key={s.n} className="step-card flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <span className="gold-gradient-text text-2xl font-extrabold leading-none block">{s.n}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/30">{s.icon}</span>
                    <h3 className="font-bold text-white text-sm">{s.title}</h3>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-lg mx-auto premium-card">
          <span className="section-label">Get started</span>
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Tip privately. <span className="gold-gradient-text">Today.</span>
          </h2>
          <p className="text-white/45 text-sm mb-8 leading-relaxed">
            Free on Sepolia testnet. Claim MYST from the faucet, find a creator, send your first encrypted tip in under
            a minute.
          </p>
          <div className="flex justify-center">
            <div className="pulse-cta rounded-xl">
              <RainbowKitCustomConnectButton />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/25">
          <span className="font-bold text-white/40">
            Tip<span className="text-[#FED10A]/60">Myst</span>
          </span>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/0xRepox/tipmyst-v2"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://docs.zama.ai/protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              Zama Docs
            </a>
            <a
              href="https://sepolia.etherscan.io/address/0x9C6174C7E452C5ECe8A87E639Da10eb9db0a6439"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              Contract
            </a>
          </div>
          <span>Built with Zama FHEVM</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Role selector ──────────────────────────────────────────────────────── */
function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-16">
      <Background />
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <span className="section-label">Welcome</span>
          <h2 className="text-4xl font-extrabold text-white mb-3">How are you using TipMyst?</h2>
          <p className="text-white/45 text-sm">Choose your role — you can switch at any time.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Supporter */}
          <button
            onClick={() => onSelect("supporter")}
            className="premium-card premium-card-hover text-left group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:glow-gold"
          >
            <div className="feature-icon feature-icon-gold mb-5">
              <Send size={22} />
            </div>
            <h3 className="text-xl font-extrabold mb-2 gold-gradient-text">Supporter</h3>
            <p className="text-sm text-white/45 leading-relaxed mb-5">
              Browse creators and send privately encrypted tips. The amount is your secret — even the blockchain
              can&apos;t see it.
            </p>
            <ul className="space-y-1.5 text-xs text-white/40">
              {["Send encrypted tips", "Decrypt your balance", "Claim free MYST"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#FED10A]/60">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-1 text-[#FED10A]/70 text-xs font-semibold">
              Get started <ArrowRight size={12} />
            </div>
          </button>

          {/* Creator */}
          <button
            onClick={() => onSelect("creator")}
            className="premium-card premium-card-hover text-left group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:glow-teal"
          >
            <div className="feature-icon feature-icon-teal mb-5">
              <Sparkles size={22} />
            </div>
            <h3 className="text-xl font-extrabold mb-2 teal-text">Creator</h3>
            <p className="text-sm text-white/45 leading-relaxed mb-5">
              Register your profile on-chain. Supporters can discover you and tip your wallet with fully encrypted
              amounts.
            </p>
            <ul className="space-y-1.5 text-xs text-white/40">
              {["Register on-chain profile", "Receive encrypted tips", "Decrypt your balance"].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#6BA292]/60">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-1 text-[#6BA292]/70 text-xs font-semibold">
              Register now <ArrowRight size={12} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── App shell ──────────────────────────────────────────────────────────── */
function AppShell({ role, onSwitchRole }: { role: Role; onSwitchRole: () => void }) {
  const tm = useTipMyst();
  const { address } = useAccount();

  const isRegisteredCreator = useMemo(
    () => (address ? tm.creatorAddresses.some(a => a.toLowerCase() === address.toLowerCase()) : false),
    [address, tm.creatorAddresses],
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        {role === "supporter" ? (
          <span className="gold-badge text-xs">💎 Supporter</span>
        ) : (
          <span className="blue-badge text-xs">✦ Creator</span>
        )}
        <button onClick={onSwitchRole} className="outline-gold-button text-xs px-3 py-1.5">
          Switch Role
        </button>
      </div>

      <StatusMessage message={tm.message} />

      {role === "supporter" ? (
        <div className="space-y-5">
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
        <div className="space-y-5">
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

/* ─── Root ───────────────────────────────────────────────────────────────── */
export default function Home() {
  const { isConnected } = useAccount();
  const [role, setRole] = useState<Role | null>(null);

  if (!isConnected) return <LandingPage />;
  if (!role) return <RoleSelector onSelect={setRole} />;
  return <AppShell role={role} onSwitchRole={() => setRole(null)} />;
}
