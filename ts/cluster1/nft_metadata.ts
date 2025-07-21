import wallet from "../Turbin3-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://developers.metaplex.com/token-metadata#a-json-standard

        const image = "https://devnet.irys.xyz/vH7zoiMj4CGsZDys7RYj1d3y8mG9tELnpTSMDeE3Svu" // image uri from nft_image.ts
        const metadata = {
            name: "Namaste Jupiverse", // name of the nft
            symbol: "NJH", // symbol of the nft
            description: "Namaste Jupiverse Hackathon Edition - Hyderabad", // description of the nft
            image,
            attributes: [
                {trait_type: 'Hackathon', value: 'Namaste Jupiverse'} // attributes of the nft
            ],
            properties: {
                files: [
                    {
                        type: "image/jpg",
                        uri: image
                    },
                ]
            },
            creators: [] // creators of the nft
        };
        const myUri = await umi.uploader.uploadJson(metadata);
        console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
