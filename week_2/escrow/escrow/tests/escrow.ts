import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";
import { Escrow } from "../target/types/escrow";

describe("escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.escrow as Program<Escrow>;

  const maker = Keypair.generate();
  let mintA: PublicKey, mintB: PublicKey, makerAtaA: PublicKey, makerAtaB: PublicKey;
  let escrowPda: PublicKey, vaultAta: PublicKey;
  const seed = new BN(42);
  const receive = new BN(1000);
  const depositAmount = new BN(500);

  before(async () => {
    // Airdrop SOL to maker
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(maker.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    // Create mints
    mintA = await createMint(provider.connection, maker, maker.publicKey, null, 6);
    mintB = await createMint(provider.connection, maker, maker.publicKey, null, 6);
    // Create maker's ATAs
    makerAtaA = (await getOrCreateAssociatedTokenAccount(provider.connection, maker, mintA, maker.publicKey)).address;
    makerAtaB = (await getOrCreateAssociatedTokenAccount(provider.connection, maker, mintB, maker.publicKey)).address;
    // Mint tokens to maker
    await mintTo(provider.connection, maker, mintA, makerAtaA, maker, 2000);
    await mintTo(provider.connection, maker, mintB, makerAtaB, maker, 2000);
    // Derive escrow PDA and vault ATA ONCE, after all above are set
    [escrowPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    vaultAta = await getAssociatedTokenAddress(
      mintA,
      escrowPda,
      true // allowOwnerOffCurve
    );
    // Check balances
    const balA = await getAccount(provider.connection, makerAtaA);
    assert.equal(Number(balA.amount), 2000);
  });

  it("Initializes escrow (make)", async () => {
    await program.methods
      .make(seed, receive)
      .accounts({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([maker])
      .rpc();
    // Check escrow account exists
    const escrowAccount = await program.account.escrow.fetch(escrowPda);
    assert.ok(escrowAccount);
    assert.equal(Number(escrowAccount.seed), 42);
    assert.equal(escrowAccount.maker.toBase58(), maker.publicKey.toBase58());
  });

  it("Deposits into escrow", async () => {
    try {
      await program.methods
        .deposit(depositAmount)
        .accounts({
          maker: maker.publicKey,
          mintA,
          mintB,
          makerAtaA,
          escrow: escrowPda,
          vault: vaultAta,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([maker])
        .rpc();
      // Check vault balance
      const vaultBal = await getAccount(provider.connection, vaultAta);
      assert.equal(Number(vaultBal.amount), Number(depositAmount));
    } catch (e: any) {
      // Print Anchor logs for debugging
      if (e.logs) {
        console.log("Anchor logs:", e.logs.join("\n"));
      } else {
        console.log("Error (no logs):", e);
      }
      throw e; // rethrow so the test still fails
    }
  });
  it("Refunds and closes vault", async () => {
    await program.methods
      .refund()
      .accounts({
        maker: maker.publicKey,
        mintA,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([maker])
      .rpc();
    // Vault should be closed, so fetching should fail
    let closed = false;
    try {
      await getAccount(provider.connection, vaultAta);
    } catch (e) {
      closed = true;
    }
    assert.ok(closed, "Vault should be closed after refund");
  });

  it("Take completes the escrow swap", async () => {
    // 1. Create new maker and taker
    const maker = Keypair.generate();
    const taker = Keypair.generate();
    // 2. Airdrop SOL to both
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(maker.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(taker.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    // 3. Create new mints
    const mintA = await createMint(provider.connection, maker, maker.publicKey, null, 6);
    const mintB = await createMint(provider.connection, maker, maker.publicKey, null, 6);
    // 4. Create ATAs
    const makerAtaA = (await getOrCreateAssociatedTokenAccount(provider.connection, maker, mintA, maker.publicKey)).address;
    const makerAtaB = (await getOrCreateAssociatedTokenAccount(provider.connection, maker, mintB, maker.publicKey)).address;
    const takerAtaA = (await getOrCreateAssociatedTokenAccount(provider.connection, taker, mintA, taker.publicKey)).address;
    const takerAtaB = (await getOrCreateAssociatedTokenAccount(provider.connection, taker, mintB, taker.publicKey)).address;
    // 5. Mint Token A to maker, Token B to taker
    await mintTo(provider.connection, maker, mintA, makerAtaA, maker, 2000);
    await mintTo(provider.connection, maker, mintB, takerAtaB, maker, 1000);
    // 6. Derive escrow PDA and vault ATA
    const seed = new BN(99); // use a unique seed for this test
    const receive = new BN(1000);
    const depositAmount = new BN(500);
    const [escrowPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );
    const vaultAta = await getAssociatedTokenAddress(
      mintA,
      escrowPda,
      true // allowOwnerOffCurve
    );
    // 7. Create escrow (make)
    await program.methods
      .make(seed, receive)
      .accounts({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([maker])
      .rpc();
    // 8. Deposit into escrow
    await program.methods
      .deposit(depositAmount)
      .accounts({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPda,
        vault: vaultAta,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([maker])
      .rpc();
    // 9. Call take
    await program.methods
      .take()
      .accounts({
        taker: taker.publicKey,
        mintA,
        mintB,
        takerAtaB,
        makerAtaB,
        vault: vaultAta,
        takerAtaA,
        escrow: escrowPda,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([taker])
      .rpc();
    // 10. Assert taker received Token A
    const takerA = await getAccount(provider.connection, takerAtaA);
    assert.equal(Number(takerA.amount), Number(depositAmount));
    // 11. Assert maker received Token B
    const makerB = await getAccount(provider.connection, makerAtaB);
    assert.equal(Number(makerB.amount), Number(receive));
    // 12. Vault should be closed
    let closed = false;
    try {
      await getAccount(provider.connection, vaultAta);
    } catch (e) {
      closed = true;
    }
    assert.ok(closed, "Vault should be closed after take");
  });
});
