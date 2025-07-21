# Solana Escrow Project - Complete Guide

This project contains **two main components**:
1. **Vault Program** - A simple SOL vault for depositing and withdrawing SOL
2. **Escrow Program** - A token swap escrow system for trading SPL tokens

## 🏗️ Project Structure

```
escrow/
├── vault/                    # SOL Vault Program (Anchor/Rust)
│   ├── programs/vault/      # Smart contract source code
│   ├── tests/               # Test files
│   └── Anchor.toml         # Anchor configuration
├── escrow/                  # Token Escrow Program (Anchor/Rust)
│   ├── programs/escrow/    # Smart contract source code
│   ├── tests/              # Test files
│   └── Anchor.toml         # Anchor configuration
└── escrow-frontend/        # React Frontend for Escrow
    ├── src/                # React components
    └── package.json        # Frontend dependencies
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, you need to install these tools:

1. **Node.js** (v16+ recommended)
   ```bash
   # Download from https://nodejs.org/
   # Or use nvm:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 16
   nvm use 16
   ```

2. **Yarn** (Package manager)
   ```bash
   npm install -g yarn
   ```

3. **Solana CLI** (Blockchain tools)
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   # Add to PATH in ~/.bashrc:
   export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
   ```

4. **Anchor CLI** (Solana development framework)
   ```bash
   npm install -g @coral-xyz/anchor-cli
   ```

5. **SPL Token CLI** (For creating tokens)
   ```bash
   npm install -g @solana/spl-token
   ```

### Verify Installation
```bash
node --version      # Should show v16+
yarn --version      # Should show version
solana --version    # Should show version
anchor --version    # Should show version
spl-token --version # Should show version
```

---

## 💰 Part 1: SOL Vault Program

The vault program allows users to deposit, withdraw, and manage SOL securely on Solana.

### What is a Vault?
- A **vault** is like a digital safe where you can store SOL
- It uses **PDAs (Program Derived Addresses)** for security
- Only the owner can withdraw funds
- Built with **Anchor framework** in **Rust**

### Key Concepts

#### 1. **PDA (Program Derived Address)**
```rust
// Vault State PDA - stores metadata
[seeds = [b"state", user.key().as_ref()], bump]

// Vault PDA - holds the actual SOL
[seeds = [b"vault", vault_state.key().as_ref()], bump]
```
- **PDA** = Deterministic address derived from seeds
- **Bump** = A number that ensures the address is valid
- **Seeds** = Data used to generate the address

#### 2. **Account Structure**
```rust
pub struct VaultState {
    pub vault_bump: u8,    // Bump for vault PDA
    pub state_bump: u8,    // Bump for state PDA
}
```

### Commands & Operations

#### **Step 1: Setup Environment**
```bash
cd escrow/vault
yarn install
```

#### **Step 2: Configure Wallet**
```bash
# Option A: Use default wallet
# (Uses ~/.config/solana/id.json)

# Option B: Use custom wallet
export ANCHOR_WALLET=/path/to/your/wallet.json
```

#### **Step 3: Configure Network**
```bash
# For local development (default)
# No changes needed

# For devnet testing
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com

# For mainnet (be careful!)
export ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com
```

#### **Step 4: Build the Program**
```bash
anchor build
```
**What this does:**
- Compiles the Rust code into WebAssembly (WASM)
- Generates TypeScript types for the frontend
- Creates the program binary

#### **Step 5: Deploy the Program**
```bash
anchor deploy
```
**What this does:**
- Uploads the compiled program to Solana
- Returns a **Program ID** (like a contract address)
- Costs SOL for deployment (rent)

#### **Step 6: Run Tests**
```bash
yarn test
```
**What this does:**
- Runs all test scenarios
- Tests: Initialize → Deposit → Withdraw → Close
- Shows transaction signatures and balances

### Test Output Explanation

When you run `yarn test`, you'll see:

```
✅ Is initialized!
- Creates vault state account
- Funds vault with rent-exempt SOL
- Saves bump seeds

✅ Is Depositing!
- Transfers 0.5 SOL from user to vault
- Shows vault balance after deposit

✅ Is Withdrawing!
- Transfers 0.5 SOL from vault back to user
- Shows vault balance after withdrawal

✅ Is Closed!
- Transfers remaining SOL back to user
- Closes vault accounts
```

### Understanding the Code

#### **Initialize Function**
```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.initialize(&ctx.bumps)
}
```
- Creates two PDAs: `vault_state` and `vault`
- Funds vault with rent-exempt SOL
- Saves bump seeds for future use

#### **Deposit Function**
```rust
pub fn deposit(ctx: Context<Payment>, amount: u64) -> Result<()> {
    ctx.accounts.deposit(amount)
}
```
- Transfers SOL from user to vault
- Uses CPI (Cross-Program Invocation) to call System Program

#### **Withdraw Function**
```rust
pub fn withdraw(ctx: Context<Payment>, amount: u64) -> Result<()> {
    ctx.accounts.withdraw(amount)
}
```
- Transfers SOL from vault to user
- Uses PDA as signer for authorization

#### **Close Function**
```rust
pub fn close(ctx: Context<Close>) -> Result<()> {
    ctx.accounts.close()
}
```
- Transfers all remaining SOL back to user
- Closes vault accounts to reclaim rent

---

## 🔄 Part 2: Token Escrow Program

The escrow program allows users to create secure token swaps on Solana.

### What is an Escrow?
- An **escrow** is a secure way to trade tokens
- One party deposits tokens, another party can claim them
- Uses **SPL tokens** (Solana's token standard)
- Prevents fraud in peer-to-peer trading

### Key Concepts

#### 1. **SPL Tokens**
- **SPL** = Solana Program Library
- **Mint** = The token definition (like USD, BTC)
- **Token Account** = Holds tokens of a specific mint
- **ATA** = Associated Token Account (standardized token account)

#### 2. **Escrow Flow**
```
1. Maker creates escrow (deposits Token A)
2. Taker can claim Token A by providing Token B
3. Or Maker can refund and get Token A back
```

### Commands & Operations

#### **Step 1: Create SPL Tokens**

**Create Mint A:**
```bash
spl-token --payer /path/to/your-wallet.json create-token
```
**What this does:**
- Creates a new SPL token mint
- Returns a mint address (like a token contract)
- Your wallet becomes the mint authority

**Example Output:**
```
Creating token E4XtvddxQaJWL5vue29KPBnuszT5ukYnDKWaenC3gpTe
```

**Create Token Account for Mint A:**
```bash
spl-token --payer /path/to/your-wallet.json create-account <MINT_A_ADDRESS>
```
**What this does:**
- Creates a token account to hold tokens
- Associates it with your wallet
- Returns the token account address

**Mint Tokens to Your Account:**
```bash
spl-token --mint-authority /path/to/your-wallet.json mint <MINT_A_ADDRESS> <AMOUNT> <TOKEN_ACCOUNT_ADDRESS>
```
**What this does:**
- Creates new tokens and sends them to your account
- Only the mint authority can do this
- Amount is in base units (e.g., 1000000000 for 1 token)

**Repeat for Mint B:**
```bash
# Create Mint B
spl-token --payer /path/to/your-wallet.json create-token

# Create token account for Mint B
spl-token --payer /path/to/your-wallet.json create-account <MINT_B_ADDRESS>

# Mint tokens to your account
spl-token --mint-authority /path/to/your-wallet.json mint <MINT_B_ADDRESS> <AMOUNT> <TOKEN_ACCOUNT_ADDRESS>
```

#### **Step 2: Setup Escrow Program**
```bash
cd escrow/escrow
yarn install
```

#### **Step 3: Build and Deploy**
```bash
anchor build
anchor deploy
```

#### **Step 4: Run Tests**
```bash
yarn test
```

### Understanding the Escrow Code

#### **Make Function (Create Escrow)**
```rust
pub fn make(ctx: Context<Make>, seed: u64, receive: u64) -> Result<()> {
    ctx.accounts.init_esrow(seed, receive, &ctx.bumps)?;
    Ok(())
}
```
**What this does:**
- Creates escrow account with unique seed
- Sets up vault for Token A
- Records how much Token B is expected

#### **Deposit Function**
```rust
pub fn deposit(ctx: Context<Deposit>, deposit: u64) -> Result<()> {
    ctx.accounts.deposit(deposit)
}
```
**What this does:**
- Transfers Token A from maker to vault
- Uses `transfer_checked` for safety
- Validates token amounts and decimals

#### **Refund Function**
```rust
pub fn refund(ctx: Context<Refund>) -> Result<()> {
    ctx.accounts.refund_and_close_vault()
}
```
**What this does:**
- Returns Token A from vault to maker
- Closes vault account
- Only maker can call this

### Test Flow Explanation

The tests demonstrate the complete escrow lifecycle:

1. **Setup Phase:**
   ```typescript
   // Create two token mints
   mintA = await createMint(provider.connection, maker, maker.publicKey, null, 6);
   mintB = await createMint(provider.connection, maker, maker.publicKey, null, 6);
   
   // Create token accounts
   makerAtaA = await getOrCreateAssociatedTokenAccount(provider.connection, maker, mintA, maker.publicKey);
   makerAtaB = await getOrCreateAssociatedTokenAccount(provider.connection, maker, mintB, maker.publicKey);
   
   // Mint tokens to accounts
   await mintTo(provider.connection, maker, mintA, makerAtaA.address, maker, 2000);
   await mintTo(provider.connection, maker, mintB, makerAtaB.address, maker, 2000);
   ```

2. **Create Escrow:**
   ```typescript
   await program.methods.make(seed, receive).accounts({...}).rpc();
   ```

3. **Deposit Tokens:**
   ```typescript
   await program.methods.deposit(depositAmount).accounts({...}).rpc();
   ```

4. **Refund and Close:**
   ```typescript
   await program.methods.refund().accounts({...}).rpc();
   ```

---

## 🌐 Part 3: Frontend Application

The frontend provides a user-friendly interface for creating and managing escrows.

### Setup Frontend
```bash
cd escrow/escrow-frontend
npm install
npm start
```

### Frontend Features
- **Wallet Connection** - Connect Phantom or other Solana wallets
- **Token Input** - Enter mint addresses for tokens to swap
- **Escrow Creation** - Create new escrows with specified amounts
- **Status Tracking** - View escrow details and status

### Using the Frontend

1. **Connect Wallet:**
   - Click "Connect Wallet"
   - Approve connection in your wallet

2. **Enter Token Details:**
   - **Mint A Address** - The token you're offering
   - **Mint B Address** - The token you want to receive
   - **Amount** - How much of Token A to deposit

3. **Create Escrow:**
   - Click "Create Escrow"
   - Approve transaction in wallet
   - View escrow details

---

## 🔧 Troubleshooting

### Common Errors & Solutions

#### **"DeclaredProgramIdMismatch"**
**Problem:** Program ID doesn't match across files
**Solution:**
```bash
# Check all files have same program ID
grep -r "DYti6i44SscFmSX5mKG8wDmR6SURzR8LHnrtXpPePC1C" .

# Clean and rebuild
anchor clean
anchor build
anchor deploy
```

#### **"Missing Signature"**
**Problem:** Wallet not properly configured
**Solution:**
```bash
# Set wallet path
export ANCHOR_WALLET=/path/to/your/wallet.json

# Or use default
solana config set --keypair ~/.config/solana/id.json
```

#### **"Owner Does Not Match"**
**Problem:** Wrong mint authority for token operations
**Solution:**
```bash
# Use the keypair that created the mint
spl-token --mint-authority /path/to/creator-wallet.json mint <MINT_ADDRESS> <AMOUNT> <RECIPIENT>
```

#### **"Insufficient Funds"**
**Problem:** Not enough SOL for transactions
**Solution:**
```bash
# Airdrop SOL (devnet only)
solana airdrop 2 <WALLET_ADDRESS> --url devnet

# Check balance
solana balance <WALLET_ADDRESS>
```

### Network-Specific Commands

#### **Localnet (Default)**
```bash
# Start local validator
anchor localnet

# Reset localnet
anchor localnet --reset
```

#### **Devnet**
```bash
# Set devnet
solana config set --url devnet

# Airdrop SOL
solana airdrop 2 <WALLET_ADDRESS> --url devnet
```

#### **Mainnet**
```bash
# Set mainnet (be careful!)
solana config set --url mainnet-beta

# Ensure you have real SOL
solana balance <WALLET_ADDRESS>
```

---

## 📚 Key Concepts Explained

### **What is Solana?**
- A high-performance blockchain
- Uses **Proof of Stake** consensus
- **SOL** is the native token (like ETH on Ethereum)
- **Lamports** are the smallest unit (1 SOL = 1,000,000,000 lamports)

### **What is Anchor?**
- A framework for building Solana programs
- Provides **macros** and **utilities** to simplify development
- Generates **TypeScript clients** automatically
- Handles **account validation** and **instruction processing**

### **What are PDAs?**
- **Program Derived Addresses** - deterministic addresses
- Created using **seeds** and **bump**
- Can be used as **signers** for program authority
- Example: `[b"vault", user.key().as_ref()]`

### **What are SPL Tokens?**
- **Solana Program Library** tokens
- Similar to **ERC-20** on Ethereum
- Each token has a **mint** (definition) and **accounts** (holders)
- **ATAs** (Associated Token Accounts) are standardized token accounts

### **What is CPI?**
- **Cross-Program Invocation** - calling other programs
- Used to transfer SOL (System Program) or tokens (Token Program)
- Requires proper **signer seeds** for PDA authorization

---

## 🛠️ Development Workflow

### **Typical Development Cycle:**

1. **Write Code** → Edit Rust files in `programs/`
2. **Build** → `anchor build`
3. **Test** → `yarn test`
4. **Deploy** → `anchor deploy`
5. **Frontend** → `npm start` (in frontend directory)

### **Debugging Tips:**

1. **Check Logs:**
   ```bash
   # View program logs
   solana logs <PROGRAM_ID>
   ```

2. **Inspect Accounts:**
   ```bash
   # View account data
   solana account <ACCOUNT_ADDRESS>
   ```

3. **Test Transactions:**
   ```bash
   # Simulate transaction
   solana confirm <TRANSACTION_SIGNATURE>
   ```

---

## 📖 Additional Resources

- **[Anchor Book](https://book.anchor-lang.com/)** - Complete Anchor documentation
- **[Solana Docs](https://docs.solana.com/)** - Official Solana documentation
- **[SPL Token Docs](https://spl.solana.com/token)** - Token program documentation
- **[Solana Cookbook](https://solanacookbook.com/)** - Practical examples and recipes

---

## 🎯 Summary

This project demonstrates:

1. **Vault Program** - Secure SOL storage using PDAs
2. **Escrow Program** - Token swap functionality with SPL tokens
3. **Frontend** - User-friendly interface for escrow management

**Key Commands Used:**
- `anchor build` - Compile programs
- `anchor deploy` - Deploy to blockchain
- `yarn test` - Run tests
- `spl-token create-token` - Create new tokens
- `spl-token mint` - Mint tokens to accounts

**Key Concepts:**
- **PDAs** for secure account management
- **SPL Tokens** for digital assets
- **CPI** for cross-program communication
- **Anchor** for simplified development

---

**Happy building on Solana! 🚀**

---

## 📋 Important Addresses & Signatures Reference

| **Component** | **Type** | **Address/Signature** | **Description** |
|---------------|----------|----------------------|-----------------|
| **Vault Program** | Program ID | `DYti6i44SscFmSX5mKG8wDmR6SURzR8LHnrtXpPePC1C` | Main vault program address |
| **Escrow Program** | Program ID | `EJecuqHBByUEX6ezuewtaZMeG6YzU1VJV3MbP4fDLT1a` | Main escrow program address |
| **System Program** | Program ID | `11111111111111111111111111111111` | Solana's system program |
| **Token Program** | Program ID | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` | SPL Token program |
| **Associated Token Program** | Program ID | `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` | Associated Token Account program |
| **Vault Wallet** | Wallet | `./Turbin3-wallet.json` | Vault program wallet (configured in Anchor.toml) |
| **Escrow Wallet** | Wallet | `~/.config/solana/id.json` | Escrow program wallet (configured in Anchor.toml) |
| **Mint A** | Token Mint | `[Generated during test]` | Created by `createMint()` in escrow tests |
| **Mint B** | Token Mint | `[Generated during test]` | Created by `createMint()` in escrow tests |
| **Maker Wallet** | Wallet | `[Generated during test]` | Created by `Keypair.generate()` in escrow tests |
| **Vault State PDA** | Account | `[Derived from user + "state" seed]` | Stores vault metadata |
| **Vault PDA** | Account | `[Derived from vault_state + "vault" seed]` | Holds SOL in vault |
| **Escrow PDA** | Account | `[Derived from maker + seed + "escrow"]` | Escrow account |
| **Vault ATA** | Token Account | `[Associated with escrow PDA]` | Holds tokens in escrow |
| **Maker ATA A** | Token Account | `[Associated with maker + mint A]` | Maker's token A account |
| **Maker ATA B** | Token Account | `[Associated with maker + mint B]` | Maker's token B account |

### 🔍 How to Find Your Addresses

#### **Get Your Wallet Address:**
```bash
solana address
```

#### **Get Program IDs:**
```bash
# After deployment, check Anchor.toml
cat vault/Anchor.toml
cat escrow/Anchor.toml
```

#### **Get Mint Addresses:**
```bash
# After creating tokens
spl-token --payer /path/to/your-wallet.json create-token
# Output: Creating token E4XtvddxQaJWL5vue29KPBnuszT5ukYnDKWaenC3gpTe
```

#### **Get Token Account Addresses:**
```bash
# After creating token accounts
spl-token --payer /path/to/your-wallet.json create-account <MINT_ADDRESS>
# Output: Creating account 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

#### **Get PDA Addresses:**
```bash
# Use Solana CLI to derive PDAs
solana address --keypair <KEYPAIR> --program-id <PROGRAM_ID>
```

### 📝 Transaction Signatures (Examples)

| **Operation** | **Transaction Signature** | **Network** | **How to Get** |
|---------------|--------------------------|-------------|----------------|
| Vault Initialize | `[Generated during test]` | Devnet | Run `yarn test` in vault/ |
| Vault Deposit | `[Generated during test]` | Devnet | Run `yarn test` in vault/ |
| Vault Withdraw | `[Generated during test]` | Devnet | Run `yarn test` in vault/ |
| Escrow Create | `[Generated during test]` | Devnet | Run `yarn test` in escrow/ |
| Token Mint | `[Generated during test]` | Devnet | Run `yarn test` in escrow/ |

### 🔧 Quick Commands to Update This Table

```bash
# Get your wallet address
echo "Wallet: $(solana address)"

# Get deployed program IDs
echo "Vault Program: $(grep 'vault =' vault/Anchor.toml | cut -d'"' -f2)"
echo "Escrow Program: $(grep 'escrow =' escrow/Anchor.toml | cut -d'"' -f2)"

# Get recent transaction signatures
solana transaction-history $(solana address) --limit 5

# Capture test outputs (add to test files)
console.log("Wallet:", user.publicKey.toBase58());
console.log("Mint A:", mintA.toBase58());
console.log("Mint B:", mintB.toBase58());
console.log("Transaction:", tx);
```

---

**💡 Tip:** Keep this table updated as you deploy and test your programs. It's especially useful for debugging and sharing with team members! 