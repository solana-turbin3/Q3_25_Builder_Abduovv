#![allow(unexpected_cfgs)]
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2HF8oxRi9zuJo3J3CCqgXvKzUrjLXSzu6xa5qPMq1ksg");

#[program]
pub mod amm {
    use super::*;

    /// Initialize a new AMM pool
    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        fee: u16,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.init(seed, fee, authority, ctx.bumps)
    }

    /// Deposit tokens into the pool to receive LP tokens
    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)
    }

    /// Swap tokens using the constant product formula
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
        is_x: bool,
    ) -> Result<()> {
        ctx.accounts.swap(amount_in, min_amount_out, is_x)
    }
}

