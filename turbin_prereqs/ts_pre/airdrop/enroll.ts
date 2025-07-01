import { Connection, Keypair, PublicKey } from "@solana/web3.js"
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor"
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./Turbin3-wallet.json"
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { Buffer } from "buffer"; 


const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");


const keypair = Keypair.fromSecretKey(Uint8Array.from(wallet));
const connection = new Connection("https://api.devnet.solana.com");

const provider = new AnchorProvider(connection, new Wallet(keypair), {commitment: "confirmed"});

const program = new Program<Turbin3Prereq>(IDL, provider);

// create PDA
const account_seeds = [
    Buffer.from("prereqs"),
    keypair.publicKey.toBuffer(),
    ];
    const [account_key, _account_bump] = PublicKey.findProgramAddressSync(account_seeds, program.programId);
    console.log(account_key);
    console.log(program.programId);


    
      
      const mintCollection = new PublicKey("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");
      const mintTs = Keypair.generate();

      const [authority, _bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), mintCollection.toBuffer()],
        program.programId
      );

    //   (async () => {
    //     try {
    //       const txhash = await program.methods
    //         .initialize("arun_prajapati")
    //         .accounts({
    //           user: keypair.publicKey,
    //           account: account_key,
    //           system_program: SYSTEM_PROGRAM_ID,
    //         })
    //         .signers([keypair])
    //         .rpc();
      
    //       console.log(`Success! https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    //     } catch (e) {
    //       console.error(`Oops, something went wrong: ${e}`);
    //     }
    //   })();

      (async () => {
        try {
          const txhash = await program.methods
      .submitTs()
      .accounts({
        user: keypair.publicKey,
        account: account_key,
        mint: mintTs.publicKey,
        collection: mintCollection,
        authority: authority,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([keypair, mintTs])
      .rpc();

    console.log(`Success! https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
