# Solana NFT Marketplace

This is a decentralized NFT marketplace built on the Solana blockchain using the Anchor framework.

## Features

- **Marketplace Management**: Initialize and configure marketplace with customizable fee structures
- **NFT Listing**: List NFTs from verified collections with set prices
- **NFT Delisting**: Remove NFT listings and return NFTs to original owners
- **NFT Purchase**: Buy listed NFTs with automatic fee distribution
- **Collection Verification**: Only verified collection NFTs can be listed
- **Fee Management**: Configurable marketplace fees collected on each sale

## Prerequisites

- Rust 1.70+
- Solana CLI 1.16+
- Anchor CLI 0.28+
- Node.js 16+
- Yarn or npm

## Installation

1. Clone the repository:
   git clone https://github.com/blockmodule/solana-nft-marketplace.git

2. Change into the project directory:
   cd solana-nft-marketplace

3. Install the dependencies:
   yarn install

4. Build the project:
   anchor build
