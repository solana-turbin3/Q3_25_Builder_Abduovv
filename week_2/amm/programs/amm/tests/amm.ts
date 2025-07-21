import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Amm } from "../target/types/amm";
import { assert } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddress } from "@solana/spl-token";

describe("amm", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Amm as Program<Amm>;

  // Test keypairs
  const initializer = Keypair.generate();
  let mintX: PublicKey;
  let mintY: PublicKey;
  let mintLp: PublicKey;
  let config: PublicKey;
  let vaultX: PublicKey;
  let vaultY: PublicKey;
  let configBump: number;
  let lpBump: number;
  const seed = new anchor.BN(12345);
  const fee = 30;

  before(async () => {
    // Airdrop SOL to initializer
    const sig = await provider.connection.requestAirdrop(initializer.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig);

    // Create mints for X and Y
    mintX = await createMint(
      provider.connection,
      initializer,
      initializer.publicKey,
      null,
      6
    );
    mintY = await createMint(
      provider.connection,
      initializer,
      initializer.publicKey,
      null,
      6
    );

    // Derive config PDA
    [config, configBump] = await PublicKey.findProgramAddress(
      [Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)],
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
  });

  it("Can initialize the AMM", async () => {
    await program.methods
      .initialize(seed, fee, null)
      .accounts({
        initializer: initializer.publicKey,
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
      .signers([initializer])
      .rpc();

    // Fetch config account and check values
    const configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.seed.toString(), seed.toString());
    assert.equal(configAccount.fee, fee);
    assert.ok(configAccount.mintX.equals(mintX));
    assert.ok(configAccount.mintY.equals(mintY));
    assert.equal(configAccount.locked, false);
  });

  // TODO: Add deposit and swap tests using similar account setup
}); 