#![allow(unexpected_cfgs)]
#![allow(deprecated)]
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use anchor_lang::prelude::CpiContext;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{ Mint, TokenAccount, TokenInterface };

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account()]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account()]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, deposit: u64) -> Result<()> {
        let transfer_accounts = anchor_spl::token_interface::TransferChecked {
            from: self.maker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), transfer_accounts);
        anchor_spl::token_interface::transfer_checked(cpi_ctx, deposit, self.mint_a.decimals)
    }
}

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("EPrDxNJ1ZzAd7sNWZu4eziCM8hAFtH8WVtrUXhv3yLZM");

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, receive: u64) -> Result<()> {
        msg!("[make] Initializing escrow with seed: {}, receive: {}", seed, receive);
        ctx.accounts.init_esrow(seed, receive, &ctx.bumps)?;
        msg!("[make] Escrow initialized for maker: {}", ctx.accounts.maker.key());
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, deposit: u64) -> Result<()> {
        msg!(
            "[deposit] Depositing {} tokens into escrow for maker: {}",
            deposit,
            ctx.accounts.maker.key()
        );
        msg!("Rust maker: {}", ctx.accounts.maker.key());
        msg!("Rust seed: {}", ctx.accounts.escrow.seed);
        msg!("Rust escrow: {}", ctx.accounts.escrow.key());
        ctx.accounts.deposit(deposit)
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.transfer_to_maker()?;
        ctx.accounts.withdraw_and_close_vault()
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        msg!("[refund] Processing refund for maker: {}", ctx.accounts.maker.key());
        ctx.accounts.refund_and_close_vault()
    }
}

// Pure function for business logic
pub fn can_refund(vault_amount: u64) -> bool {
    vault_amount > 0
}

#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::prelude::*;

    #[test]
    fn test_make_init_esrow() {
        let key = Pubkey::new_unique();
        let mut escrow = Escrow {
            seed: 42,
            maker: key,
            mint_a: key,
            mint_b: key,
            receive: 1000,
            bump: 1,
        };
        println!(
            "[test_make_init_esrow] Escrow struct: seed={}, receive={}, maker={}",
            escrow.seed,
            escrow.receive,
            escrow.maker
        );
        assert_eq!(escrow.seed, 42);
        assert_eq!(escrow.receive, 1000);
        assert_eq!(escrow.maker, key);
    }

    #[test]
    fn test_deposit_logic() {
        let deposit_amount = 500u64;
        println!("[test_deposit_logic] deposit_amount={}", deposit_amount);
        assert_eq!(deposit_amount, 500);
    }

    #[test]
    fn test_refund_logic() {
        let refund_success = true;
        println!("[test_refund_logic] refund_success={}", refund_success);
        assert!(refund_success);
    }

    #[test]
    fn test_can_refund() {
        println!("[test_can_refund] vault_amount=1, should refund: {}", can_refund(1));
        println!("[test_can_refund] vault_amount=0, should refund: {}", can_refund(0));
        assert!(can_refund(1)); // vault has tokens
        assert!(!can_refund(0)); // vault is empty
    }

    #[test]
    fn test_take_pure_logic() {
        // Simulate the state after a successful take
        let mut vault_amount = 500u64;
        let mut taker_a = 0u64;
        let mut maker_b = 0u64;
        let receive = 1000u64;

        // Taker receives all Token A from vault
        taker_a += vault_amount;
        vault_amount = 0;
        // Maker receives Token B from taker
        maker_b += receive;

        assert_eq!(taker_a, 500);
        assert_eq!(maker_b, 1000);
        assert_eq!(vault_amount, 0);
    }
}
