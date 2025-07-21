// import React, { useMemo, useState } from "react";
// import { Connection, PublicKey, SystemProgram, Commitment } from "@solana/web3.js";
// import { useWallet, WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
// import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
// import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
// import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
// import { Copy, Shuffle, Shield, ArrowRight, Check, X, Info, Wallet, Lock, Unlock, ExternalLink, AlertCircle } from 'lucide-react';

// // Mock IDL for demo purposes
// const idl = {
//   address: "ESCRoWxnJ8HSk5wk2j7fGVZdNzZJGn1cqjjvGp1pqLhd"
// };

// const programID = new PublicKey(idl.address);
// const network = "https://api.devnet.solana.com";
// const commitment = "processed";

// function EscrowApp() {
//   const wallet = useWallet();
//   const [mintAInput, setMintAInput] = useState("");
//   const [mintBInput, setMintBInput] = useState("");
//   const [depositInput, setDepositInput] = useState("");
//   const [receiveInput, setReceiveInput] = useState("");
//   const [seedInput, setSeedInput] = useState(() => (Math.floor(Math.random() * 1e9)).toString());
//   const [escrowInfo, setEscrowInfo] = useState(null);
//   const [isCreating, setIsCreating] = useState(false);
//   const [status, setStatus] = useState('');

//   const [takeMakerInput, setTakeMakerInput] = useState("");
//   const [takeSeedInput, setTakeSeedInput] = useState("");
//   const [takeMintAInput, setTakeMintAInput] = useState("");
//   const [takeMintBInput, setTakeMintBInput] = useState("");
//   const [isTaking, setIsTaking] = useState(false);

//   const [lastEscrowPda, setLastEscrowPda] = useState("");
//   const [lastVaultAta, setLastVaultAta] = useState("");

//   const connection = useMemo(() => new Connection(network, { commitment }), []);
//   const provider = useMemo(
//     () => new AnchorProvider(connection, wallet, { preflightCommitment: commitment }),
//     [connection, wallet]
//   );
//   const program = useMemo(
//     () => new Program(idl, provider),
//     [provider]
//   );

//   const StatusIcon = ({ status }) => {
//     if (status.startsWith('Error')) return <X className="w-5 h-5 text-red-500" />;
//     if (status.startsWith('Escrow created')) return <Check className="w-5 h-5 text-green-500" />;
//     return <Info className="w-5 h-5 text-blue-500" />;
//   };

//   const createEscrow = async () => {
//     setStatus("Creating escrow...");
//     setEscrowInfo(null);
//     setIsCreating(true);
//     try {
//       if (!wallet.publicKey) {
//         setStatus("Error: Wallet not connected");
//         return;
//       }
//       if (!mintAInput || !mintBInput || !depositInput || !receiveInput || !seedInput) {
//         setStatus("Error: Please fill in all fields");
//         return;
//       }

//       // Simulate success for demo
//       setTimeout(() => {
//         setStatus("Escrow created successfully!");
//         setLastEscrowPda("ESCRoWxnJ8HSk5wk2j7fGVZdNzZJGn1cqjjvGp1pqLhd");
//         setLastVaultAta("VaultAta1234567890abcdefghijklmnopqrstuvwxyz");
//         setEscrowInfo({
//           maker: { toBase58: () => wallet.publicKey.toBase58() },
//           seed: { toString: () => seedInput }
//         });
//         setIsCreating(false);
//       }, 2000);
//     } catch (e) {
//       setStatus("Error: " + e.message);
//       setIsCreating(false);
//     }
//   };

//   const takeEscrow = async () => {
//     setStatus("Taking escrow...");
//     setIsTaking(true);
//     try {
//       if (!wallet.publicKey) {
//         setStatus("Error: Wallet not connected");
//         return;
//       }
//       if (!takeMakerInput || !takeSeedInput || !takeMintAInput || !takeMintBInput) {
//         setStatus("Error: Please fill in all fields");
//         return;
//       }

//       // Simulate success for demo
//       setTimeout(() => {
//         setStatus("Escrow taken successfully!");
//         setIsTaking(false);
//       }, 2000);
//     } catch (e) {
//       setStatus("Error: " + e.message);
//       setIsTaking(false);
//     }
//   };

//   const randomizeSeed = () => {
//     setSeedInput(Math.floor(Math.random() * 1e9).toString());
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
//       {/* Header */}
//       <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
//               <Shield className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900">Solana Escrow</h1>
//               <p className="text-sm text-gray-600">Secure token swaps on Solana</p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="text-sm text-gray-600">
//               Network: <span className="font-medium text-purple-600">Devnet</span>
//             </div>
//             <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-blue-500 !rounded-lg !text-white !font-medium" />
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-6 py-8">
//         {/* How It Works Section */}
//         <div className="mb-12 bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-200 p-8 shadow-lg">
//           <div className="flex items-start space-x-4">
//             <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
//               <Info className="w-6 h-6 text-white" />
//             </div>
//             <div className="flex-1">
//               <h2 className="text-2xl font-bold text-gray-900 mb-4">How This Escrow Works</h2>
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div className="flex items-start space-x-3">
//                     <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900">Maker Creates Escrow</h3>
//                       <p className="text-gray-600 text-sm">Set up a swap offer by specifying tokens, amounts, and a unique seed</p>
//                     </div>
//                   </div>
//                   <div className="flex items-start space-x-3">
//                     <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900">Share Details</h3>
//                       <p className="text-gray-600 text-sm">Share the escrow PDA and seed with the taker</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <div className="flex items-start space-x-3">
//                     <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900">Taker Fulfills</h3>
//                       <p className="text-gray-600 text-sm">Use the same details to complete the swap</p>
//                     </div>
//                   </div>
//                   <div className="flex items-start space-x-3">
//                     <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900">Tokens Exchanged</h3>
//                       <p className="text-gray-600 text-sm">Atomic swap completes and escrow closes</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid lg:grid-cols-2 gap-8">
//           {/* Maker Section */}
//           <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-200 p-8 shadow-lg">
//             <div className="flex items-center space-x-3 mb-6">
//               <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
//                 <Lock className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">Create Escrow</h2>
//                 <p className="text-gray-600">Set up a secure token swap offer</p>
//               </div>
//             </div>

//             {/* Maker Guide */}
//             <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-200">
//               <div className="flex items-start space-x-3">
//                 <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <h3 className="font-semibold text-purple-900 mb-2">Maker Guide</h3>
//                   <ul className="text-sm text-purple-800 space-y-1">
//                     <li>• <strong>Mint A:</strong> Token you're offering</li>
//                     <li>• <strong>Mint B:</strong> Token you want to receive</li>
//                     <li>• <strong>Amounts:</strong> Use base units (e.g., 1000000000 for 1 token with 9 decimals)</li>
//                     <li>• <strong>Seed:</strong> Unique identifier (share with taker)</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>

//             {/* Form */}
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Mint A Address
//                   <span className="text-gray-500 font-normal ml-1">(Token you're offering)</span>
//                 </label>
//                 <input
//                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                   value={mintAInput}
//                   onChange={e => setMintAInput(e.target.value)}
//                   placeholder="Enter Mint A address..."
//                 />
//               </div>

//               <div className="flex justify-center">
//                 <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
//                   <ArrowRight className="w-5 h-5 text-white" />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Mint B Address
//                   <span className="text-gray-500 font-normal ml-1">(Token you want to receive)</span>
//                 </label>
//                 <input
//                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                   value={mintBInput}
//                   onChange={e => setMintBInput(e.target.value)}
//                   placeholder="Enter Mint B address..."
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Amount to Deposit
//                     <span className="text-gray-500 font-normal text-xs block">(of Mint A)</span>
//                   </label>
//                   <input
//                     className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     value={depositInput}
//                     onChange={e => setDepositInput(e.target.value)}
//                     placeholder="e.g., 1000000000"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Amount to Receive
//                     <span className="text-gray-500 font-normal text-xs block">(of Mint B)</span>
//                   </label>
//                   <input
//                     className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     value={receiveInput}
//                     onChange={e => setReceiveInput(e.target.value)}
//                     placeholder="e.g., 1000000000"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Seed
//                   <span className="text-gray-500 font-normal ml-1">(share with taker)</span>
//                 </label>
//                 <div className="flex space-x-2">
//                   <input
//                     className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     value={seedInput}
//                     onChange={e => setSeedInput(e.target.value)}
//                     placeholder="Enter unique seed..."
//                   />
//                   <button
//                     onClick={randomizeSeed}
//                     className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
//                     title="Generate random seed"
//                   >
//                     <Shuffle className="w-4 h-4" />
//                     <span className="hidden sm:inline">Random</span>
//                   </button>
//                 </div>
//               </div>

//               <button
//                 onClick={createEscrow}
//                 disabled={!wallet.connected || isCreating}
//                 className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//               >
//                 {isCreating ? (
//                   <>
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Creating Escrow...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Lock className="w-5 h-5" />
//                     <span>Create Escrow</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>

//           {/* Taker Section */}
//           <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-200 p-8 shadow-lg">
//             <div className="flex items-center space-x-3 mb-6">
//               <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
//                 <Unlock className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">Take Escrow</h2>
//                 <p className="text-gray-600">Fulfill an existing escrow offer</p>
//               </div>
//             </div>

//             {/* Taker Guide */}
//             <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
//               <div className="flex items-start space-x-3">
//                 <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
//                 <div>
//                   <h3 className="font-semibold text-blue-900 mb-2">Taker Guide</h3>
//                   <ul className="text-sm text-blue-800 space-y-1">
//                     <li>• <strong>Maker Address:</strong> Escrow creator's wallet</li>
//                     <li>• <strong>Seed:</strong> Unique identifier from maker</li>
//                     <li>• <strong>Mint A:</strong> Token you'll receive</li>
//                     <li>• <strong>Mint B:</strong> Token you'll send</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>

//             {/* Form */}
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Maker Address
//                   <span className="text-gray-500 font-normal ml-1">(from maker)</span>
//                 </label>
//                 <input
//                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   value={takeMakerInput}
//                   onChange={e => setTakeMakerInput(e.target.value)}
//                   placeholder="Enter maker's address..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Seed
//                   <span className="text-gray-500 font-normal ml-1">(from maker)</span>
//                 </label>
//                 <input
//                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   value={takeSeedInput}
//                   onChange={e => setTakeSeedInput(e.target.value)}
//                   placeholder="Enter escrow seed..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Mint A Address
//                   <span className="text-gray-500 font-normal ml-1">(token you'll receive)</span>
//                 </label>
//                 <input
//                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   value={takeMintAInput}
//                   onChange={e => setTakeMintAInput(e.target.value)}
//                   placeholder="Enter Mint A address..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Mint B Address
//                   <span className="text-gray-500 font-normal ml-1">(token you'll send)</span>
//                 </label>
//                 <input
//                   className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                   value={takeMintBInput}
//                   onChange={e => setTakeMintBInput(e.target.value)}
//                   placeholder="Enter Mint B address..."
//                 />
//               </div>

//               <button
//                 onClick={takeEscrow}
//                 disabled={!wallet.connected || isTaking}
//                 className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
//               >
//                 {isTaking ? (
//                   <>
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Taking Escrow...</span>
//                   </>
//                 ) : (
//                   <>
//                     <Unlock className="w-5 h-5" />
//                     <span>Take Escrow</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Status Message */}
//         {status && (
//           <div className="mt-8">
//             <div className={`p-4 rounded-xl border-2 flex items-center space-x-3 ${
//               status.startsWith('Error') 
//                 ? 'bg-red-50 border-red-200 text-red-800' 
//                 : status.includes('successfully') 
//                 ? 'bg-green-50 border-green-200 text-green-800'
//                 : 'bg-blue-50 border-blue-200 text-blue-800'
//             }`}>
//               <StatusIcon status={status} />
//               <span className="font-medium">{status}</span>
//             </div>
//           </div>
//         )}

//         {/* Escrow Info */}
//         {escrowInfo && (
//           <div className="mt-8">
//             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8 shadow-lg">
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center space-x-3">
//                   <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
//                     <Check className="w-6 h-6 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-bold text-green-900">Escrow Created Successfully!</h3>
//                     <p className="text-green-700">Share these details with the taker</p>
//                   </div>
//                 </div>
//                 <button 
//                   onClick={() => copyToClipboard(lastEscrowPda)}
//                   className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
//                   title="Copy Escrow PDA"
//                 >
//                   <Copy className="w-5 h-5 text-gray-600" />
//                 </button>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <div className="space-y-4">
//                   <div className="bg-white/70 rounded-lg p-4">
//                     <div className="text-sm font-semibold text-gray-700 mb-1">Escrow PDA</div>
//                     <div className="text-sm text-gray-600 font-mono break-all">{lastEscrowPda}</div>
//                   </div>
//                   <div className="bg-white/70 rounded-lg p-4">
//                     <div className="text-sm font-semibold text-gray-700 mb-1">Vault ATA</div>
//                     <div className="text-sm text-gray-600 font-mono break-all">{lastVaultAta}</div>
//                   </div>
//                 </div>
//                 <div className="space-y-4">
//                   <div className="bg-white/70 rounded-lg p-4">
//                     <div className="text-sm font-semibold text-gray-700 mb-1">Maker Address</div>
//                     <div className="text-sm text-gray-600 font-mono break-all">
//                       {escrowInfo.maker && escrowInfo.maker.toBase58 ? escrowInfo.maker.toBase58() : String(escrowInfo.maker)}
//                     </div>
//                   </div>
//                   <div className="bg-white/70 rounded-lg p-4">
//                     <div className="text-sm font-semibold text-gray-700 mb-1">Seed</div>
//                     <div className="text-sm text-gray-600 font-mono">
//                       {escrowInfo.seed && escrowInfo.seed.toString ? escrowInfo.seed.toString() : String(escrowInfo.seed)}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="mt-16 text-center">
//           <div className="inline-flex items-center space-x-4 text-gray-600">
//             <div className="flex items-center space-x-2">
//               <Shield className="w-4 h-4" />
//               <span>Powered by Solana</span>
//             </div>
//             <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
//             <span>Secure & Decentralized</span>
//             <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
//             <a href="#" className="flex items-center space-x-1 hover:text-purple-600 transition-colors">
//               <span>Documentation</span>
//               <ExternalLink className="w-4 h-4" />
//             </a>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function App() {
//   const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
//   return (
//     <ConnectionProvider endpoint={network}>
//       <WalletProvider wallets={wallets} autoConnect>
//         <WalletModalProvider>
//           <EscrowApp />
//         </WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   );
// }