import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { Vault } from "../target/types/vault.js";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { assert } from "chai"; // Chai for assertions in tests
import 'dotenv/config'; 
import BN from "bn.js";

describe("Vault", () => {
  // Configure the client to use the local cluster (devnet/localnet)
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  // Get the user's wallet keypair from the provider
  const user = provider.wallet.payer;
  console.log(user.publicKey.toBase58()) 
  
  // Reference to the Vault program from workspace
  const program = anchor.workspace.vault as Program<Vault>;

  // Derive the PDA for the vault state using a static seed and user public key
  const [vaultStatePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("state"),
      user.publicKey.toBytes()
    ],
    program.programId,
  );

  // Derive the PDA for the vault itself using a seed based on the vault state PDA
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vault"),
      vaultStatePDA.toBytes()
    ],
    program.programId,
  );

  // Test: Initialize the vault
  it("Is initialized!", async () => {
    try {
      const tx = await program.methods
        .initialize()
        .accountsPartial({
          user: user.publicKey,
          vault: vaultPDA,
          vaultState: vaultStatePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(); // Send transaction
      console.log("Your transaction signature", tx); // Print transaction signature
    } catch (error) {
      // Log errors and anchor logs if available
      console.error("Test failed:", error);
      if (error.logs) {
        console.error("Anchor logs:", error.logs);
      } else if (error.error && error.error.logs) {
        console.error("Anchor logs:", error.error.logs);
      }
      throw error; // Re-throw error for test framework to catch
    }
  });

  // Test: Deposit funds into the vault
  it("Is Depositing!", async () => {
    try {
      const tx = await program.methods
        .deposit(new BN(0.5 * LAMPORTS_PER_SOL)) // Deposit 50 SOL
        .accountsPartial({
          user: user.publicKey,
          vault: vaultPDA,
          vaultState: vaultStatePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(); // Send transaction
      console.log("Your transaction signature", tx);
      
      // Get and print current vault balance
      const balance = await provider.connection.getBalance(vaultPDA)
      console.log(`current vault balance: , ${balance / LAMPORTS_PER_SOL} SOL`)
      
      // Assert vault balance increased appropriately
      assert(balance > 0.5 * LAMPORTS_PER_SOL, "the deposit has some issue")
    } catch (error) {
      // Log errors and anchor logs if available
      console.error("Test failed:", error);
      if (error.logs) {
        console.error("Anchor logs:", error.logs);
      } else if (error.error && error.error.logs) {
        console.error("Anchor logs:", error.error.logs);
      }
      throw error;
    }
  });

  // Test: Withdraw funds from the vault
  it("Is Withdrawing!", async () => {
    try {
      const tx = await program.methods
        .withdraw(new BN(0.5 * LAMPORTS_PER_SOL)) // Withdraw 50 SOL
        .accountsPartial({
          user: user.publicKey,
          vault: vaultPDA,
          vaultState: vaultStatePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(); // Send transaction
      console.log("Your transaction signature", tx);

      // Get and print current vault balance
      const balance = await provider.connection.getBalance(vaultPDA)
      console.log(`current vault balance: , ${balance / LAMPORTS_PER_SOL} SOL`)

      // Assert that the vault balance is below the withdrawn amount
      assert(balance < 0.5 * LAMPORTS_PER_SOL, "the withdraw has some issue")
    } catch (error) {
      // Log errors and anchor logs if available
      console.error("Test failed:", error);
      if (error.logs) {
        console.error("Anchor logs:", error.logs);
      } else if (error.error && error.error.logs) {
        console.error("Anchor logs:", error.error.logs);
      }
      throw error;
    }
  });

  // Test: Close the vault
  it("Is Closed!", async () => {
    try {
      const tx = await program.methods
        .close()
        .accountsPartial({
          user: user.publicKey,
          vault: vaultPDA,
          vaultState: vaultStatePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(); // Send transaction
      console.log("Your transaction signature", tx);
    } catch (error) {
      // Log errors and anchor logs if available
      console.error("Test failed:", error);
      if (error.logs) {
        console.error("Anchor logs:", error.logs);
      } else if (error.error && error.error.logs) {
        console.error("Anchor logs:", error.error.logs);
      }
      throw error;
    }
  });
});
