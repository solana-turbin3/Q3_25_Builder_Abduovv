"use client";
import WalletProvider from "./wallet-provider";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { getAmmProgram, PROGRAM_ID } from "../utils/amm";
import { PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount } from "@solana/spl-token";
import { createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Helper to create ATA for browser wallets
async function createAtaIfNotExist(
  connection: anchor.web3.Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>
) {
  const ata = await getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
  const accountInfo = await connection.getAccountInfo(ata);
  if (!accountInfo) {
    // Debug logs for all arguments
    console.log("DEBUG: payer", payer, payer.toBase58?.(), typeof payer, payer instanceof PublicKey);
    console.log("DEBUG: ata", ata, ata.toBase58?.(), typeof ata, ata instanceof PublicKey);
    console.log("DEBUG: owner", owner, owner.toBase58?.(), typeof owner, owner instanceof PublicKey);
    console.log("DEBUG: mint", mint, mint.toBase58?.(), typeof mint, mint instanceof PublicKey);
    console.log("DEBUG: TOKEN_PROGRAM_ID", TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID.toBase58?.(), typeof TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID instanceof PublicKey);
    console.log("DEBUG: ASSOCIATED_TOKEN_PROGRAM_ID", ASSOCIATED_TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID.toBase58?.(), typeof ASSOCIATED_TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID instanceof PublicKey);
    const tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer, // payer
        ata,   // ata
        owner, // owner
        mint,  // mint
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    // Log the transaction's instruction program IDs
    tx.instructions.forEach((ix, i) => {
      console.log(`Instruction ${i}: programId = ${ix.programId.toBase58()}`);
    });
    tx.feePayer = payer;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signed = await signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, "confirmed");
  }
  return ata;
}

function Home() {
  const { connection } = useConnection();
  const { publicKey, connected, wallet, signTransaction } = useWallet();
  const [status, setStatus] = useState<string>("");
  const [poolState, setPoolState] = useState<any>(null);
  const [userBalances, setUserBalances] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // User input state
  const [depositAmount, setDepositAmount] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState(true); // true = X to Y

  // Store mint addresses and user token accounts in state
  const [mintX, setMintX] = useState<PublicKey | null>(null);
  const [mintY, setMintY] = useState<PublicKey | null>(null);
  const [mintLp, setMintLp] = useState<PublicKey | null>(null);
  const [config, setConfig] = useState<PublicKey | null>(null);
  const [vaultX, setVaultX] = useState<PublicKey | null>(null);
  const [vaultY, setVaultY] = useState<PublicKey | null>(null);
  const [userX, setUserX] = useState<PublicKey | null>(null);
  const [userY, setUserY] = useState<PublicKey | null>(null);
  const [userLp, setUserLp] = useState<PublicKey | null>(null);

  // Example: hardcoded seed/fee for demo
  const SEED = new anchor.BN(12345);
  const FEE = 30;

  // Helper: get program instance
  const program = connected && wallet?.adapter && wallet.adapter.publicKey
    ? getAmmProgram(connection, wallet.adapter)
    : null;

  // Pool initialization
  const handleInitialize = async () => {
    if (!program || !publicKey || !signTransaction) return;
    setStatus("Initializing pool...");
    try {
      // Derive PDAs
      const [configPda] = await PublicKey.findProgramAddress([
        Buffer.from("config"),
        SEED.toArrayLike(Buffer, "le", 8),
      ], PROGRAM_ID);
      setConfig(configPda);
      const [mintLpPda] = await PublicKey.findProgramAddress([
        Buffer.from("lp"), configPda.toBuffer()
      ], PROGRAM_ID);
      setMintLp(mintLpPda);
      // Create mints for X and Y (manual for browser wallet)
      const mintXKeypair = Keypair.generate();
      const mintYKeypair = Keypair.generate();
      setMintX(mintXKeypair.publicKey);
      setMintY(mintYKeypair.publicKey);
      // Create mint accounts and initialize them
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      // Mint X
      let tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintXKeypair.publicKey,
          space: 82,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintXKeypair.publicKey,
          6,
          publicKey,
          null
        )
      );
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.partialSign(mintXKeypair);
      const signedTx = await signTransaction(tx);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid, "confirmed");
      // Mint Y
      let tx2 = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintYKeypair.publicKey,
          space: 82,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
          mintYKeypair.publicKey,
          6,
          publicKey,
          null
        )
      );
      tx2.feePayer = publicKey;
      tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx2.partialSign(mintYKeypair);
      const signedTx2 = await signTransaction(tx2);
      const txid2 = await connection.sendRawTransaction(signedTx2.serialize());
      await connection.confirmTransaction(txid2, "confirmed");
      // Derive vaults
      const vaultXAddr = await anchor.utils.token.associatedAddress({ mint: mintXKeypair.publicKey, owner: configPda });
      const vaultYAddr = await anchor.utils.token.associatedAddress({ mint: mintYKeypair.publicKey, owner: configPda });
      setVaultX(vaultXAddr);
      setVaultY(vaultYAddr);
      // Create user token accounts (browser wallet safe)
      const userXAddr = await createAtaIfNotExist(connection, mintXKeypair.publicKey, publicKey, publicKey, signTransaction);
      const userYAddr = await createAtaIfNotExist(connection, mintYKeypair.publicKey, publicKey, publicKey, signTransaction);
      setUserX(userXAddr);
      setUserY(userYAddr);
      // User LP token account
      const userLpAddr = await createAtaIfNotExist(connection, mintLpPda, publicKey, publicKey, signTransaction);
      setUserLp(userLpAddr);
      // Send initialize tx
      await program.methods
        .initialize(SEED, FEE, null)
        .accounts({
          initializer: publicKey,
          mintX: mintXKeypair.publicKey,
          mintY: mintYKeypair.publicKey,
          mintLp: mintLpPda,
          config: configPda,
          vaultX: vaultXAddr,
          vaultY: vaultYAddr,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([mintXKeypair, mintYKeypair])
        .rpc();
      setStatus("Pool initialized!");
      setPoolState(await program.account.config.fetch(configPda));
      await fetchUserBalances();
    } catch (e: any) {
      setStatus("Error: " + e.message);
      console.error("Initialize error:", e);
    }
  };

  // Deposit
  const handleDeposit = async (e: any) => {
    e.preventDefault();
    if (!program || !publicKey) {
      setStatus("Wallet not connected or program not loaded");
      return;
    }
    if (!mintX || !mintY || !mintLp || !config || !vaultX || !vaultY || !userX || !userY || !userLp) {
      setStatus("Missing pool or user accounts. Please initialize the pool first.");
      console.error({ mintX, mintY, mintLp, config, vaultX, vaultY, userX, userY, userLp });
      return;
    }
    setStatus("Depositing...");
    try {
      const amount = Number(depositAmount);
      await program.methods
        .deposit(new anchor.BN(amount), new anchor.BN(amount), new anchor.BN(amount))
        .accounts({
          user: publicKey,
          mintX,
          mintY,
          config,
          vaultX,
          vaultY,
          mintLp,
          userX,
          userY,
          userLp,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus("Deposit complete!");
      setPoolState(await program.account.config.fetch(config));
      await fetchUserBalances();
    } catch (e: any) {
      setStatus("Error: " + e.message);
      console.error("Deposit error:", e, { mintX, mintY, mintLp, config, vaultX, vaultY, userX, userY, userLp });
    }
  };

  // Swap
  const handleSwap = async (e: any) => {
    e.preventDefault();
    if (!program || !publicKey) {
      setStatus("Wallet not connected or program not loaded");
      return;
    }
    if (!mintX || !mintY || !config || !vaultX || !vaultY || !userX || !userY) {
      setStatus("Missing pool or user accounts. Please initialize the pool first.");
      console.error({ mintX, mintY, config, vaultX, vaultY, userX, userY });
      return;
    }
    setStatus("Swapping...");
    try {
      const amount = Number(swapAmount);
      await program.methods
        .swap(new anchor.BN(amount), new anchor.BN(0), swapDirection)
        .accounts({
          user: publicKey,
          mintX,
          mintY,
          config,
          vaultX,
          vaultY,
          userX,
          userY,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus("Swap complete!");
      setPoolState(await program.account.config.fetch(config));
      await fetchUserBalances();
    } catch (e: any) {
      setStatus("Error: " + e.message);
      console.error("Swap error:", e, { mintX, mintY, config, vaultX, vaultY, userX, userY });
    }
  };

  // Fetch user balances
  const fetchUserBalances = async () => {
    if (!connection || !userX || !userY || !userLp) return;
    const x = await getAccount(connection, userX);
    const y = await getAccount(connection, userY);
    const lp = await getAccount(connection, userLp);
    setUserBalances({
      x: Number(x.amount) / 1e6,
      y: Number(y.amount) / 1e6,
      lp: Number(lp.amount) / 1e6,
    });
  };

  // Fetch pool/user state on connect
  useEffect(() => {
    if (connected) fetchUserBalances();
    // eslint-disable-next-line
  }, [connected, userX, userY, userLp]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center py-10">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-lg p-8 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Solana AMM Demo</h1>
          {mounted && <WalletMultiButton className="!bg-indigo-600 !text-white" />}
        </div>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 transition rounded-lg px-4 py-3 font-semibold"
          onClick={handleInitialize}
          disabled={!connected}
        >
          Initialize Pool
        </button>
        <form className="flex flex-col gap-4" onSubmit={handleDeposit}>
          <div className="flex gap-2 items-end">
            <input
              type="number"
              min="0"
              step="any"
              className="rounded px-3 py-2 text-black"
              placeholder="Deposit Amount"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              disabled={!connected}
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 transition rounded-lg px-4 py-2 font-semibold"
              disabled={!connected}
            >
              Deposit
            </button>
          </div>
        </form>
        <form className="flex flex-col gap-4" onSubmit={handleSwap}>
          <div className="flex gap-2 items-end">
            <input
              type="number"
              min="0"
              step="any"
              className="rounded px-3 py-2 text-black"
              placeholder="Swap Amount"
              value={swapAmount}
              onChange={e => setSwapAmount(e.target.value)}
              disabled={!connected}
            />
            <select
              className="rounded px-2 py-2 text-black"
              value={swapDirection ? "xToY" : "yToX"}
              onChange={e => setSwapDirection(e.target.value === "xToY")}
              disabled={!connected}
            >
              <option value="xToY">X to Y</option>
              <option value="yToX">Y to X</option>
            </select>
            <button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 transition rounded-lg px-4 py-2 font-semibold"
              disabled={!connected}
            >
              Swap
            </button>
          </div>
        </form>
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h2 className="text-lg font-semibold mb-2">Status</h2>
          <div className="text-sm text-gray-300 min-h-[24px]">{status}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h2 className="text-lg font-semibold mb-2">Pool State</h2>
          <div className="text-sm text-gray-300 break-all">
            {poolState ? JSON.stringify(poolState, null, 2) : "(No pool initialized)"}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <h2 className="text-lg font-semibold mb-2">Your Balances</h2>
          <div className="text-sm text-gray-300">
            {userBalances ? (
              <>
                <div>X: {userBalances.x}</div>
                <div>Y: {userBalances.y}</div>
                <div>LP: {userBalances.lp}</div>
              </>
            ) : "(Connect wallet and initialize pool)"}
          </div>
        </div>
      </div>
      <footer className="mt-10 text-gray-400 text-xs">Built with Next.js, Tailwind, Solana, and Anchor</footer>
    </div>
  );
}

export default function HomeWithWallet() {
  return (
    <WalletProvider>
      <Home />
    </WalletProvider>
  );
}
