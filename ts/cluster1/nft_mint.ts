import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, PublicKey, generateSigner, percentAmount } from "@metaplex-foundation/umi"
import { createNft, fetchMasterEditionFromSeeds, mplTokenMetadata, printV1, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../Turbin3-wallet.json"
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata())

// -------------------------------------------------------------
// --------------------  Mint --------------------
// -------------------------------------------------------------

const mint = generateSigner(umi);

(async () => {
    let tx = createNft(umi, {
        mint, 
        name: "Namaste Jupiverse",
        uri: "https://gateway.irys.xyz/Ffkm1ChW11bx6M9jUPgjYJUrwGac4BN8Au3j5uH77PaX", //metadata uri
        sellerFeeBasisPoints: percentAmount(100), //this will not accept values >100
        symbol: "NJH",
        isCollection: true,
        // trying to fuck around and find out if i could mint 15 of these nfts
        collectionDetails: {
            __kind: "V1",
            size: 15,
        },
        printSupply: { __kind: "Limited", fields: [15] }, // this is the number of nfts to mint
    })
    let result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);

    console.log(`Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`)

    console.log("Mint Address: ", mint.publicKey);
})();




// collection mint 4WiT9VQ9jrqB2xTVD84xuM5ToMm7jqygusR7Z9sHrzx6

const mintAddress = "4WiT9VQ9jrqB2xTVD84xuM5ToMm7jqygusR7Z9sHrzx6" as PublicKey;

// -------------------------------------------------------------
// -------------------- Collection Mint --------------------
// -------------------------------------------------------------

(async () => {
    try {
        const masterEdition = await fetchMasterEditionFromSeeds(umi, {
            mint: mintAddress,
        });

        for (let i = 1n; i <= 14n; i++) {
            const editionMint = generateSigner(umi);

            console.log(`Minting edition #${i.toString()}`);

            await printV1(umi, {
                masterTokenAccountOwner: myKeypairSigner,
                masterEditionMint: mintAddress,
                editionMint,
                editionTokenAccountOwner: myKeypairSigner.publicKey,
                editionNumber: masterEdition.supply + i, 
                tokenStandard: TokenStandard.NonFungible,
            }).sendAndConfirm(umi);

            console.log(`✅ Edition #${i.toString()} minted`);
        }

        console.log(`🎉 All 14 editions minted successfully!`);

    } catch (error) {
        console.error("❌ Oops.. Something went wrong", error);
    }
})();

