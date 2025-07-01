import { Transaction, SystemProgram, Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, PublicKey } from"@solana/web3.js"
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("2N74o2JDtceCnvsVjkBUs2SMUvAsS3ozqbQZHkEJEXvZ");

const connection = new Connection("https://api.devnet.solana.com");

(async () => {
    try{

        const balance = await connection.getBalance(from.publicKey);


//test transaction for fee
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: LAMPORTS_PER_SOL / 100,   
            })
        );
        transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;
        transaction.feePayer = from.publicKey;

        const fee = (await connection.getFeeForMessage(transaction.compileMessage(),'confirmed')).value || 0;
        transaction.instructions.pop();

//final transaction
        transaction.add(
            SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to,
            lamports: balance - fee,
            })
            );

        const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
        console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    } catch (error) {
        console.error(`Oops, something went wrong: ${error}`);
    }
})();
