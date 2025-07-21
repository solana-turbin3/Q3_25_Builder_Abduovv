import React, { useMemo, useState } from "react";
import { Connection, PublicKey, SystemProgram, Commitment } from "@solana/web3.js";
import { useWallet, WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Copy, Shuffle, Shield, ArrowRight, Check, X, Info, Lock, Unlock, AlertCircle } from 'lucide-react';

import idl from "./idl/escrow.json";
import { Buffer } from "buffer";
import "./App.css";
if (window.Buffer === undefined) {
  window.Buffer = Buffer;
}
require("@solana/wallet-adapter-react-ui/styles.css");

const programID = new PublicKey(idl.address);
const network = "https://api.devnet.solana.com"; // devnet endpoint
const commitment: Commitment = "processed";

function EscrowApp() {
  const wallet = useWallet();
  const [mintAInput, setMintAInput] = useState<string>("");
  const [mintBInput, setMintBInput] = useState<string>("");
  const [depositInput, setDepositInput] = useState<string>("");
  const [receiveInput, setReceiveInput] = useState<string>("");
  const [seedInput, setSeedInput] = useState<string>(() => (Math.floor(Math.random() * 1e9)).toString());
  const [escrowInfo, setEscrowInfo] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState('');

  // New state for take instruction
  const [takeMakerInput, setTakeMakerInput] = useState<string>("");
  const [takeSeedInput, setTakeSeedInput] = useState<string>("");
  const [takeMintAInput, setTakeMintAInput] = useState<string>("");
  const [takeMintBInput, setTakeMintBInput] = useState<string>("");
  const [isTaking, setIsTaking] = useState(false);

  const [lastEscrowPda, setLastEscrowPda] = useState<string>("");
  const [lastVaultAta, setLastVaultAta] = useState<string>("");

  const connection = useMemo(() => new Connection(network, { commitment }), []);
  const provider = useMemo(
    () => new AnchorProvider(connection, wallet as any, { preflightCommitment: commitment }),
    [connection, wallet]
  );
  const program = useMemo(
    () => new Program(idl as any, provider),
    [provider]
  );

  const StatusIcon = ({ status }: { status: string }) => {
    if (status.startsWith('Error')) return <X className="w-5 h-5 text-red-500" />;
    if (status.startsWith('Escrow created')) return <Check className="w-5 h-5 text-green-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const createEscrow = async () => {
    setStatus("Creating escrow...");
    setEscrowInfo(null);
    try {
      if (!wallet.publicKey) {
        setStatus("Wallet not connected");
        return;
      }
      if (!mintAInput || !mintBInput || !depositInput || !receiveInput || !seedInput) {
        setStatus("Please enter all fields.");
        return;
      }
      const mintA = new PublicKey(mintAInput);
      const mintB = new PublicKey(mintBInput);
      const seed = new BN(seedInput);
      const deposit = new BN(depositInput);
      const receive = new BN(receiveInput);
      // Derive escrow PDA
      const [escrowPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("escrow"),
          wallet.publicKey.toBuffer(),
          seed.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      // Derive vault ATA (do NOT create it, let the program do it)
      const vaultAta = await getAssociatedTokenAddress(
        mintA,
        escrowPda,
        true // allowOwnerOffCurve
      );
      setLastEscrowPda(escrowPda.toBase58());
      setLastVaultAta(vaultAta.toBase58());
      // Derive maker's ATA for mintA
      const makerAtaA = await getAssociatedTokenAddress(
        mintA,
        wallet.publicKey
      );
      console.log('maker:', wallet.publicKey.toBase58());
      console.log('mintA:', mintA.toBase58());
      console.log('makerAtaA:', makerAtaA.toBase58());
      // Call the make instruction
      const tx = await program.methods
        .make(seed, receive)
        .accounts({
          maker: wallet.publicKey,
          mintA,
          mintB,
          makerAtaA,
          escrow: escrowPda,
          vault: vaultAta,
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus(`Escrow created! Tx: ${tx}`);
      // Fetch and display escrow account data
      const escrowAccount = await (program.account as any).escrow.fetch(escrowPda);
      setEscrowInfo(escrowAccount);
    } catch (e: any) {
      console.error("Full error object:", e);
      let errMsg = e.message || JSON.stringify(e);
      if (e.logs) errMsg += "\n" + e.logs.join("\n");
      setStatus("Error: " + errMsg);
    }
  };

  const takeEscrow = async () => {
    setStatus("Taking escrow...");
    try {
      if (!wallet.publicKey) {
        setStatus("Wallet not connected");
        return;
      }
      if (!takeMakerInput || !takeSeedInput || !takeMintAInput || !takeMintBInput) {
        setStatus("Please enter all fields for take.");
        return;
      }
      const maker = new PublicKey(takeMakerInput);
      const seed = new BN(takeSeedInput);
      const mintA = new PublicKey(takeMintAInput);
      const mintB = new PublicKey(takeMintBInput);
      // Derive escrow PDA
      const [escrowPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("escrow"),
          maker.toBuffer(),
          seed.toArrayLike(Buffer, "le", 8)
        ],
        program.programId
      );
      // Derive vault ATA (owned by escrow PDA)
      const vaultAta = await getAssociatedTokenAddress(
        mintA,
        escrowPda,
        true
      );
      // Taker's ATA for mintB (source for Token B)
      const takerAtaB = await getAssociatedTokenAddress(
        mintB,
        wallet.publicKey
      );
      // Maker's ATA for mintB (destination for Token B)
      const makerAtaB = await getAssociatedTokenAddress(
        mintB,
        maker
      );
      // Taker's ATA for mintA (destination for Token A)
      const takerAtaA = await getAssociatedTokenAddress(
        mintA,
        wallet.publicKey
      );
      // Call the take instruction with the new account order
      const tx = await program.methods
        .take()
        .accounts({
          taker: wallet.publicKey,
          maker,
          mintA,
          mintB,
          takerAtaA,
          takerAtaB,
          makerAtaB,
          escrow: escrowPda,
          vault: vaultAta,
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setStatus(`Escrow taken! Tx: ${tx}`);
    } catch (e: any) {
      console.error("Full error object (take):", e);
      let errMsg = e.message || JSON.stringify(e);
      if (e.logs) errMsg += "\n" + e.logs.join("\n");
      setStatus("Error: " + errMsg);
    }
  };

  const randomizeSeed = () => {
    setSeedInput(Math.floor(Math.random() * 1e9).toString());
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Escrow PDA copied to clipboard!");
    } catch (err) {
      setStatus("Failed to copy Escrow PDA.");
      console.error(err);
    }
  };

  return (
    <div className="escrow-root">
      {/* Header */}
      <div className="escrow-header">
        <div className="escrow-header-inner">
          <div className="escrow-header-left">
            <div className="escrow-header-logo">
              <Shield style={{ width: 24, height: 24, color: '#fff' }} />
            </div>
            <div>
              <div className="escrow-header-title">Solana Escrow</div>
              <div className="escrow-header-desc">Secure token swaps on Solana</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="escrow-header-network">Network: Devnet</span>
            <WalletMultiButton />
          </div>
        </div>
      </div>

      <div className="escrow-main">
        {/* How It Works Section */}
        <div className="escrow-how">
          <div className="escrow-how-flex">
            <div className="escrow-how-icon">
              <Info style={{ width: 24, height: 24, color: '#fff' }} />
            </div>
            <div className="escrow-how-content">
              <div className="escrow-how-title">How This Escrow Works</div>
              <div className="escrow-how-steps">
                <div>
                  <div className="escrow-how-step">
                    <div className="escrow-how-step-num">1</div>
                    <div>
                      <div className="escrow-how-step-title">Maker Creates Escrow</div>
                      <div className="escrow-how-step-desc">Set up a swap offer by specifying tokens, amounts, and a unique seed</div>
                    </div>
                  </div>
                  <div className="escrow-how-step">
                    <div className="escrow-how-step-num blue">2</div>
                    <div>
                      <div className="escrow-how-step-title">Share Details</div>
                      <div className="escrow-how-step-desc">Share the escrow PDA and seed with the taker</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="escrow-how-step">
                    <div className="escrow-how-step-num indigo">3</div>
                    <div>
                      <div className="escrow-how-step-title">Taker Fulfills</div>
                      <div className="escrow-how-step-desc">Use the same details to complete the swap</div>
                    </div>
                  </div>
                  <div className="escrow-how-step">
                    <div className="escrow-how-step-num green">4</div>
                    <div>
                      <div className="escrow-how-step-title">Tokens Exchanged</div>
                      <div className="escrow-how-step-desc">Atomic swap completes and escrow closes</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="escrow-sections">
          {/* Maker Section */}
          <div className="escrow-card">
            <div className="escrow-card-header">
              <div className="escrow-card-header-icon">
                <Lock style={{ width: 24, height: 24, color: '#fff' }} />
              </div>
              <div>
                <div className="escrow-card-header-title">Create Escrow</div>
                <div className="escrow-card-header-desc">Set up a secure token swap offer</div>
              </div>
            </div>

            {/* Maker Guide */}
            <div className="escrow-guide">
              <div className="escrow-guide-icon">
                <AlertCircle style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div className="escrow-guide-content-title">Maker Guide</div>
                <ul className="escrow-guide-list">
                  <li>• <strong>Mint A:</strong> Token you're offering</li>
                  <li>• <strong>Mint B:</strong> Token you want to receive</li>
                  <li>• <strong>Amounts:</strong> Use base units (e.g., 1000000000 for 1 token with 9 decimals)</li>
                  <li>• <strong>Seed:</strong> Unique identifier (share with taker)</li>
                </ul>
              </div>
            </div>

            {/* Form */}
            <form className="escrow-form" onSubmit={e => { e.preventDefault(); createEscrow(); }}>
              <div>
                <label className="escrow-form-label">
                  Mint A Address
                  <span className="escrow-form-label-desc">(Token you're offering)</span>
                </label>
                <input
                  className="escrow-form-input"
                  value={mintAInput}
                  onChange={e => setMintAInput(e.target.value)}
                  placeholder="Enter Mint A address..."
                />
              </div>

              <div className="escrow-form-arrow">
                <ArrowRight style={{ width: 20, height: 20, color: '#fff' }} />
              </div>

              <div>
                <label className="escrow-form-label">
                  Mint B Address
                  <span className="escrow-form-label-desc">(Token you want to receive)</span>
                </label>
                <input
                  className="escrow-form-input"
                  value={mintBInput}
                  onChange={e => setMintBInput(e.target.value)}
                  placeholder="Enter Mint B address..."
                />
              </div>

              <div className="escrow-form-row">
                <div>
                  <label className="escrow-form-label">
                    Amount to Deposit
                    <span className="escrow-form-label-desc">(of Mint A)</span>
                  </label>
                  <input
                    className="escrow-form-input"
                    value={depositInput}
                    onChange={e => setDepositInput(e.target.value)}
                    placeholder="e.g., 1000000000"
                  />
                </div>
                <div>
                  <label className="escrow-form-label">
                    Amount to Receive
                    <span className="escrow-form-label-desc">(of Mint B)</span>
                  </label>
                  <input
                    className="escrow-form-input"
                    value={receiveInput}
                    onChange={e => setReceiveInput(e.target.value)}
                    placeholder="e.g., 1000000000"
                  />
                </div>
              </div>

              <div>
                <label className="escrow-form-label">
                  Seed
                  <span className="escrow-form-label-desc">(share with taker)</span>
                </label>
                <div className="escrow-form-seed-row">
                  <input
                    className="escrow-form-input"
                    value={seedInput}
                    onChange={e => setSeedInput(e.target.value)}
                    placeholder="Enter unique seed..."
                  />
                  <button
                    type="button"
                    onClick={randomizeSeed}
                    className="escrow-form-seed-btn"
                    title="Generate random seed"
                  >
                    <Shuffle style={{ width: 16, height: 16 }} />
                    <span className="escrow-form-seed-btn-text">Random</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!wallet.connected || isCreating}
                className="escrow-form-btn"
              >
                {isCreating ? (
                  <>
                    <div className="escrow-form-btn-spinner"></div>
                    <span>Creating Escrow...</span>
                  </>
                ) : (
                  <>
                    <Lock style={{ width: 20, height: 20 }} />
                    <span>Create Escrow</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Taker Section */}
          <div className="escrow-card taker">
            <div className="escrow-card-header">
              <div className="escrow-card-header-icon taker">
                <Unlock style={{ width: 24, height: 24, color: '#fff' }} />
              </div>
              <div>
                <div className="escrow-card-header-title">Take Escrow</div>
                <div className="escrow-card-header-desc">Fulfill an existing escrow offer</div>
              </div>
            </div>

            {/* Taker Guide */}
            <div className="escrow-guide taker">
              <div className="escrow-guide-icon taker">
                <AlertCircle style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <div className="escrow-guide-content-title taker">Taker Guide</div>
                <ul className="escrow-guide-list taker">
                  <li>• <strong>Maker Address:</strong> Escrow creator's wallet</li>
                  <li>• <strong>Seed:</strong> Unique identifier from maker</li>
                  <li>• <strong>Mint A:</strong> Token you'll receive</li>
                  <li>• <strong>Mint B:</strong> Token you'll send</li>
                </ul>
              </div>
            </div>

            {/* Form */}
            <form className="escrow-form" onSubmit={e => { e.preventDefault(); takeEscrow(); }}>
              <div>
                <label className="escrow-form-label">
                  Maker Address
                  <span className="escrow-form-label-desc">(from maker)</span>
                </label>
                <input
                  className="escrow-form-input"
                  value={takeMakerInput}
                  onChange={e => setTakeMakerInput(e.target.value)}
                  placeholder="Enter maker's address..."
                />
              </div>

              <div>
                <label className="escrow-form-label">
                  Seed
                  <span className="escrow-form-label-desc">(from maker)</span>
                </label>
                <input
                  className="escrow-form-input"
                  value={takeSeedInput}
                  onChange={e => setTakeSeedInput(e.target.value)}
                  placeholder="Enter escrow seed..."
                />
              </div>

              <div>
                <label className="escrow-form-label">
                  Mint A Address
                  <span className="escrow-form-label-desc">(token you'll receive)</span>
                </label>
                <input
                  className="escrow-form-input"
                  value={takeMintAInput}
                  onChange={e => setTakeMintAInput(e.target.value)}
                  placeholder="Enter Mint A address..."
                />
              </div>

              <div>
                <label className="escrow-form-label">
                  Mint B Address
                  <span className="escrow-form-label-desc">(token you'll send)</span>
                </label>
                <input
                  className="escrow-form-input"
                  value={takeMintBInput}
                  onChange={e => setTakeMintBInput(e.target.value)}
                  placeholder="Enter Mint B address..."
                />
              </div>

              <button
                type="submit"
                disabled={!wallet.connected || isTaking}
                className="escrow-form-btn"
              >
                {isTaking ? (
                  <>
                    <div className="escrow-form-btn-spinner"></div>
                    <span>Taking Escrow...</span>
                  </>
                ) : (
                  <>
                    <Unlock style={{ width: 20, height: 20 }} />
                    <span>Take Escrow</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Status Message */}
        {status && (
          <div className="escrow-status">
            <div className={`escrow-status-inner${status.startsWith('Error') ? ' error' : status.includes('successfully') ? ' success' : ' info'}`}> 
              <StatusIcon status={status} />
              <span>{status}</span>
            </div>
          </div>
        )}

        {/* Escrow Info */}
        {escrowInfo && (
          <div className="escrow-info">
            <div className="escrow-info-card">
              <div className="escrow-info-header">
                <div className="escrow-info-header-left">
                  <div className="escrow-card-header-icon" style={{ background: 'linear-gradient(90deg, #22d3ee 0%, #34d399 100%)' }}>
                    <Check style={{ width: 24, height: 24, color: '#fff' }} />
                  </div>
                  <div>
                    <div className="escrow-info-header-title">Escrow Created Successfully!</div>
                    <div className="escrow-info-header-desc">Share these details with the taker</div>
                  </div>
                </div>
                <button 
                  onClick={() => copyToClipboard(lastEscrowPda)}
                  className="escrow-info-copy-btn"
                  title="Copy Escrow PDA"
                >
                  <Copy style={{ width: 20, height: 20, color: '#64748b' }} />
                </button>
              </div>

              <div className="escrow-info-grid">
                <div className="escrow-info-block">
                  <div className="escrow-info-label">Escrow PDA</div>
                  <div className="escrow-info-value">{lastEscrowPda}</div>
                </div>
                <div className="escrow-info-block">
                  <div className="escrow-info-label">Vault ATA</div>
                  <div className="escrow-info-value">{lastVaultAta}</div>
                </div>
                <div className="escrow-info-block">
                  <div className="escrow-info-label">Maker Address</div>
                  <div className="escrow-info-value">
                    {escrowInfo.maker && escrowInfo.maker.toBase58 ? escrowInfo.maker.toBase58() : String(escrowInfo.maker)}
                  </div>
                </div>
                <div className="escrow-info-block">
                  <div className="escrow-info-label">Seed</div>
                  <div className="escrow-info-value">
                    {escrowInfo.seed && escrowInfo.seed.toString ? escrowInfo.seed.toString() : String(escrowInfo.seed)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="escrow-footer">
          <div className="escrow-footer-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield style={{ width: 16, height: 16 }} />
              <span>Powered by Solana</span>
            </div>
            <span className="escrow-footer-dot"></span>
            <a href="https://github.com/your-repo-or-docs" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Read the Docs</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={network}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <EscrowApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 