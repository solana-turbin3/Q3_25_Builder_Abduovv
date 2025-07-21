import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddress
} from "@solana/spl-token";
import { assert } from "chai";

describe("AMM Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Amm as Program<Amm>;
  const connection = provider.connection;
  const wallet = provider.wallet;

  // Test accounts
  let mintX: PublicKey;
  let mintY: PublicKey;
  let mintLp: PublicKey;
  let config: PublicKey;
  let vaultX: PublicKey;
  let vaultY: PublicKey;
  let userX: PublicKey;
  let userY: PublicKey;
  let userLp: PublicKey;
  let configBump: number;
  let lpBump: number;
  const SEED = new anchor.BN(12345);
  const FEE = 30;

  before(async () => {
    // Create token mints
    mintX = await createMint(connection, wallet.payer, wallet.publicKey, null, 6);
    mintY = await createMint(connection, wallet.payer, wallet.publicKey, null, 6);

    // Derive config PDA
    [config, configBump] = await PublicKey.findProgramAddress(
      [Buffer.from("config"), SEED.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    // Derive LP mint PDA
    [mintLp, lpBump] = await PublicKey.findProgramAddress(
      [Buffer.from("lp"), config.toBuffer()],
      program.programId
    );
    // Derive vaults
    vaultX = await getAssociatedTokenAddress(mintX, config, true);
    vaultY = await getAssociatedTokenAddress(mintY, config, true);

    // Create user token accounts
    userX = await createAssociatedTokenAccount(connection, wallet.payer, mintX, wallet.publicKey);
    userY = await createAssociatedTokenAccount(connection, wallet.payer, mintY, wallet.publicKey);
    userLp = await getAssociatedTokenAddress(mintLp, wallet.publicKey);

    // Mint tokens to user accounts
    await mintTo(connection, wallet.payer, mintX, userX, wallet.publicKey, 1_000_000_000);
    await mintTo(connection, wallet.payer, mintY, userY, wallet.publicKey, 1_000_000_000);
  });

  it("Should initialize AMM pool successfully", async () => {
    await program.methods
      .initialize(SEED, FEE, null)
      .accounts({
        initializer: wallet.publicKey,
        mintX,
        mintY,
        mintLp,
        config,
        vaultX,
        vaultY,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify config state
    const configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.seed.toString(), SEED.toString());
    assert.equal(configAccount.fee, FEE);
    assert.ok(configAccount.mintX.equals(mintX));
    assert.ok(configAccount.mintY.equals(mintY));
    assert.equal(configAccount.locked, false);
  });

  it("Should deposit initial liquidity successfully", async () => {
    const depositAmount = new anchor.BN(100_000_000);
    await program.methods
      .deposit(depositAmount, depositAmount, depositAmount)
      .accounts({
        user: wallet.publicKey,
        mintX,
        mintY,
        config,
        vaultX,
        vaultY,
        mintLp,
        userX,
        userY,
        userLp,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Optionally, check balances here
    const vaultXAcc = await getAccount(connection, vaultX);
    const vaultYAcc = await getAccount(connection, vaultY);
    assert.ok(Number(vaultXAcc.amount) > 0);
    assert.ok(Number(vaultYAcc.amount) > 0);
  });

  // Add swap and other tests similarly, using the correct account names!
});