import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const keypair = Keypair.fromSecretKey(Uint8Array.from(wallet));

const connection = new Connection("https://api.devnet.solana.com");

(async () => {
    try{
        const txnhash = await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL * 2);
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txnhash}?cluster=devnet`);

        
        console.log("Airdrop successful");
    } catch (error) {
        console.error(`Oops, something went wrong: ${error}`);
    }
})();