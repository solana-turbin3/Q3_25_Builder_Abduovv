#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

mod states;
mod instructions;
mod errors;

pub use errors::*;
pub use states::*;
pub use instructions::*;

declare_id!("APuRCeUUpt6MUbNNxxRPyhDTss99ehvfgt2x8xKwQEbg");

/// Initializes the stake config account
///
/// # Arguments
///
/// * `points_per_stake` - number of points awarded per stake
/// * `max_unstake` - max number of NFTs that can be unstaked
/// * `freeze_period` - number of seconds an NFT must be staked before it can be unstaked
#[program]
pub mod nft_staking {
    use super::*;

    /// Initializes the stake config account
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        points_per_stake: u8,
        max_unstake: u8,
        freeze_period: u32,
    ) -> Result<()> {
        ctx.accounts.initialize_config(points_per_stake, max_unstake, freeze_period, ctx.bumps)
    }

    /// Initializes the user account
    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        ctx.accounts.initialize_user(ctx.bumps)
    }

    /// Stakes an NFT
    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        ctx.accounts.stake(ctx.bumps)
    }

    /// Unstakes an NFT
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        ctx.accounts.unstake()
    }

    /// Claims rewards for a user
    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim()
    }
}

