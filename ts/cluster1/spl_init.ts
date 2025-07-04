import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from '../node_modules/@solana/spl-token';
import wallet from "/home/abduo/Q3_25_Builder_Abduovv/solana-starter/ts/cluster1/wallet/turbin3-wallet.json"

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
    try {
        // Start here
         const mint = await createMint(
             connection,
             keypair,
             keypair.publicKey,
             null,
             6
         )
         console.log(`Your mint address: ${mint.toBase58()}`);
    } catch(error) {
        console.log(`Oops, something went wrong: ${error}`)
    }
})()
