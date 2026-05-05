"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAllow, useEncrypt, useIsAllowed, useUserDecrypt } from "@zama-fhe/react-sdk";
import { ZERO_HANDLE, ZamaSDKEvents } from "@zama-fhe/sdk";
import { bytesToHex } from "viem";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { MYSTToken } from "~~/contracts/MYSTToken";
import { TipMyst } from "~~/contracts/TipMyst";
import { deploymentFor } from "~~/utils/contract";

export type Creator = {
  address: `0x${string}`;
  name: string;
  bio: string;
  imageUrl: string;
  tipCount: bigint;
};

export const useTipMyst = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const tipMystDeployment = useMemo(() => deploymentFor(TipMyst, chainId), [chainId]);
  const tokenDeployment = useMemo(() => deploymentFor(MYSTToken, chainId), [chainId]);

  const hasContracts = Boolean(tipMystDeployment?.address && tokenDeployment?.address);

  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ── SDK events ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();
    const { CredentialsCached, DecryptEnd } = ZamaSDKEvents;
    window.addEventListener(CredentialsCached, () => setMessage("Credentials ready, decrypting..."), {
      signal: ctrl.signal,
    });
    window.addEventListener(DecryptEnd, () => setMessage("Decryption complete!"), { signal: ctrl.signal });
    return () => ctrl.abort();
  }, []);

  // ── Balance read (encrypted handle) ─────────────────────────────────────────
  const balanceRead = useReadContract({
    address: hasContracts ? tokenDeployment!.address : undefined,
    abi: hasContracts ? tokenDeployment!.abi : undefined,
    functionName: "balanceOf" as const,
    args: address ? [address] : undefined,
    query: { enabled: Boolean(hasContracts && isConnected && address), refetchOnWindowFocus: false },
  });

  const balanceHandle = useMemo(() => (balanceRead.data as string | undefined) ?? undefined, [balanceRead.data]);

  // ── Decrypt balance ──────────────────────────────────────────────────────────
  const decryptHandles = useMemo(() => {
    if (!balanceHandle || balanceHandle === ZERO_HANDLE || !tokenDeployment?.address) return [];
    return [{ handle: balanceHandle as `0x${string}`, contractAddress: tokenDeployment.address }];
  }, [balanceHandle, tokenDeployment?.address]);

  const { mutate: allow, isPending: isAllowing } = useAllow();
  const tokenAddr = (tokenDeployment?.address ?? "0x0") as `0x${string}`;
  const { data: isAllowed } = useIsAllowed({ contractAddresses: [tokenAddr] });

  const [decryptEnabled, setDecryptEnabled] = useState(false);
  const decryptQuery = useUserDecrypt({ handles: decryptHandles }, { enabled: decryptEnabled && !!isAllowed });

  const decryptedBalance = useMemo(() => {
    if (!balanceHandle || !decryptQuery.data) return undefined;
    return decryptQuery.data[balanceHandle as `0x${string}`];
  }, [balanceHandle, decryptQuery.data]);

  const isBalanceDecrypted = decryptedBalance !== undefined;

  const canViewBalance = Boolean(
    hasContracts && isConnected && address && balanceHandle && balanceHandle !== ZERO_HANDLE && !isAllowing,
  );

  const viewBalance = useCallback(async () => {
    if (!canViewBalance || !tokenDeployment?.address) return;
    setDecryptEnabled(true);
    if (!isAllowed) {
      setMessage("Authorising decryption...");
      allow([tokenDeployment.address]);
      return;
    }
    setMessage("Decrypting balance...");
  }, [canViewBalance, tokenDeployment?.address, isAllowed, allow]);

  // ── Faucet ───────────────────────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract();

  const claimFaucet = useCallback(async () => {
    if (!hasContracts || !tokenDeployment) return;
    setIsProcessing(true);
    setMessage("Claiming faucet...");
    try {
      await writeContractAsync({
        address: tokenDeployment.address,
        abi: tokenDeployment.abi,
        functionName: "claimFaucet",
        args: [],
      });
      setMessage("10 MYST claimed! Refresh balance to see it.");
      balanceRead.refetch();
    } catch (e) {
      setMessage("Faucet failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsProcessing(false);
    }
  }, [hasContracts, tokenDeployment, writeContractAsync, balanceRead]);

  // ── Creator read ─────────────────────────────────────────────────────────────
  const creatorsRead = useReadContract({
    address: hasContracts ? tipMystDeployment!.address : undefined,
    abi: hasContracts ? tipMystDeployment!.abi : undefined,
    functionName: "getAllCreators" as const,
    query: { enabled: Boolean(hasContracts && isConnected), refetchOnWindowFocus: false },
  });

  const creatorAddresses = useMemo(() => (creatorsRead.data as `0x${string}`[] | undefined) ?? [], [creatorsRead.data]);

  // ── Creator registration ──────────────────────────────────────────────────────
  const registerCreator = useCallback(
    async (name: string, bio: string, imageUrl: string) => {
      if (!hasContracts || !tipMystDeployment) return;
      setIsProcessing(true);
      setMessage("Registering creator profile...");
      try {
        await writeContractAsync({
          address: tipMystDeployment.address,
          abi: tipMystDeployment.abi,
          functionName: "registerCreator",
          args: [name, bio, imageUrl],
        });
        setMessage("Creator registered! Welcome to TipMyst.");
        creatorsRead.refetch();
      } catch (e) {
        setMessage("Registration failed: " + (e instanceof Error ? e.message : String(e)));
      } finally {
        setIsProcessing(false);
      }
    },
    [hasContracts, tipMystDeployment, writeContractAsync, creatorsRead],
  );

  // ── Send tip ─────────────────────────────────────────────────────────────────
  const encrypt = useEncrypt();

  const sendTip = useCallback(
    async (creatorAddress: `0x${string}`, amountMYST: number) => {
      if (!hasContracts || !tipMystDeployment || !address) return;

      const rawAmount = BigInt(Math.round(amountMYST * 1_000_000));
      setIsProcessing(true);
      setMessage("Encrypting tip amount...");

      try {
        const enc = await encrypt.mutateAsync({
          values: [{ value: rawAmount, type: "euint64" }],
          contractAddress: tipMystDeployment.address,
          userAddress: address,
        });

        setMessage("Sending tip...");
        await writeContractAsync({
          address: tipMystDeployment.address,
          abi: tipMystDeployment.abi,
          functionName: "sendTip",
          args: [creatorAddress, bytesToHex(enc.handles[0]!), bytesToHex(enc.inputProof)],
          gas: 15_000_000n,
        });

        setMessage("Tip sent! The amount is encrypted — only the creator can see their balance.");
        balanceRead.refetch();
      } catch (e) {
        setMessage("Tip failed: " + (e instanceof Error ? e.message : String(e)));
      } finally {
        setIsProcessing(false);
      }
    },
    [hasContracts, tipMystDeployment, address, encrypt, writeContractAsync, balanceRead],
  );

  return {
    // state
    hasContracts,
    isConnected,
    address,
    isProcessing,
    message,
    // balance
    balanceHandle,
    decryptedBalance,
    isBalanceDecrypted,
    isDecrypting: decryptQuery.isFetching,
    canViewBalance,
    viewBalance,
    refreshBalance: balanceRead.refetch,
    // faucet
    claimFaucet,
    // creators
    creatorAddresses,
    refreshCreators: creatorsRead.refetch,
    // register
    registerCreator,
    // tip
    sendTip,
    isEncrypting: encrypt.isPending,
  };
};
