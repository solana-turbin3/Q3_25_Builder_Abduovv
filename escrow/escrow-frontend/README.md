# Solana Escrow Frontend

This is a React-based frontend for a Solana Escrow smart contract. It allows users to securely create and manage token swap escrows on the Solana blockchain.

## Features
- Connect your Solana wallet (Phantom, etc.)
- Create a new escrow for swapping tokens
- View escrow details after creation
- User-friendly UI with helpful status messages

---

## How to Use

### 1. **Install Dependencies**
```bash
yarn install
```

### 2. **Start the App Locally**
```bash
yarn start
```
The app will be available at [http://localhost:3000](http://localhost:3000).

---

## How to Generate Mint A and Mint B (SPL Token Mints)

To use the app, you need two SPL token mint addresses (Mint A and Mint B). These represent the tokens you want to swap.

Below are the step-by-step commands to create new mints and associated token accounts using the Solana CLI and SPL Token CLI.

### **Prerequisites**
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) installed
- [SPL Token CLI](https://spl.solana.com/token) installed:
  ```bash
  yarn global add @solana/spl-token
  ```
- Funded wallet keypair (with SOL for fees)

---

### **Step 1: Create a New Mint (Mint A or Mint B)**

```bash
spl-token --payer /path/to/your-wallet.json create-token
```
- **What it does:** Creates a new SPL token mint. The wallet you specify with `--payer` will pay for the transaction and become the mint authority (can mint new tokens).
- **Output:** The command will print the new mint address. Save this address for use as Mint A or Mint B in the frontend.

**Example Output:**
```
Creating token E4XtvddxQaJWL5vue29KPBnuszT5ukYnDKWaenC3gpTe
```

---

### **Step 2: Create an Associated Token Account for the Mint**

```bash
spl-token --payer /path/to/your-wallet.json create-account <MINT_ADDRESS>
```
- **What it does:** Creates a token account for your wallet to hold tokens of the new mint.
- **Replace `<MINT_ADDRESS>`** with the address from the previous step.
- **Output:** Prints the new token account address (where tokens will be received).

---

### **Step 3: Mint Tokens to Your Account**

```bash
spl-token --mint-authority /path/to/your-wallet.json mint <MINT_ADDRESS> <AMOUNT> <RECIPIENT_TOKEN_ACCOUNT>
```
- **What it does:** Mints the specified amount of tokens to your token account.
- **`--mint-authority`**: The keypair that is the mint authority for the mint (usually the same as the payer used to create the mint).
- **`<AMOUNT>`**: Amount to mint (in base units, e.g., 1000000000 for 1 token with 9 decimals).
- **`<RECIPIENT_TOKEN_ACCOUNT>`**: The token account address from Step 2.

**Common Error:**
- If you see `Error: owner does not match`, it means you are not signing with the correct mint authority. Use the keypair that created the mint.

---

### **Step 4: Repeat for Mint B**
Repeat steps 1-3 to create a second mint (Mint B) and its associated token account.

---

## **Troubleshooting & Common Errors**

- **"missing signature for supplied pubkey"**
  - This means the CLI needs the private key for the owner of the account. Make sure you use the correct `--payer` and `--owner` flags, or set your default keypair with `solana config set --keypair <KEYPAIR_PATH>`.

- **"owner does not match"**
  - You are not signing with the mint authority. Use the keypair that created the mint with `--mint-authority`.

- **`--payer` flag issues**
  - If you get errors about `--payer` not being recognized, use it as a global flag:
    ```bash
    spl-token --payer /path/to/your-wallet.json create-account <MINT_ADDRESS>
    ```

---

## **Using the Mint Addresses in the Frontend**
- Copy the mint addresses you created and paste them into the "Mint A Address" and "Mint B Address" fields in the app.
- Use the associated token accounts to receive and send tokens as needed.

---

## **Learn More**
- [Solana SPL Token CLI Docs](https://spl.solana.com/token)
- [Solana Program Library GitHub](https://github.com/solana-labs/solana-program-library/tree/master/token/cli)
- [Solana Docs](https://docs.solana.com/)

---

If you have any issues, check the error messages and refer to the troubleshooting section above. For further help, open an issue or ask in the Solana Discord!
