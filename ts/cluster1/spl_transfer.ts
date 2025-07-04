import { Commitment, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import wallet from "./wallet/turbin3-wallet.json"
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("E64Dj1EDup9DEdYot26VXCMXEF4eCYvxFM71MGyFgVDy");

// Recipient address
const to = new PublicKey("FzozXYEUfyuSPckCmyh5Y73b9KZe1ZjAXzfsuRCD3Ct");

(async () => {
    try {
        // Get the token account of the fromWallet address, and if it does not exist, create it
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
        console.log(`Your from token account is: ${fromTokenAccount.address.toBase58()}`);


        // Get the token account of the toWallet address, and if it does not exist, create it
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, to);
        console.log(`Your to token account is: ${toTokenAccount.address.toBase58()}`);

        // Transfer the new token to the "toTokenAccount" we just created
        const signature = await transfer(connection, keypair, fromTokenAccount.address, toTokenAccount.address, keypair.publicKey, 10*1000000);
        console.log(`Transfer success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();