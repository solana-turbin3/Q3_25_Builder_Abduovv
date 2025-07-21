use crate::{errors::CustomError, states::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user.key.as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, StakeConfig>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"stake", user.key.as_ref(), nft_mint.key().as_ref()],
        bump = stake_account.bump,
        close = user  
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [b"vault", nft_mint.key().as_ref()],
        bump,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = user,
    )]
    pub user_nft_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> Unstake<'info> {
    pub fn unstake(&mut self) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(
            now - self.stake_account.stake_at >= self.config.freeze_period as i64,
            CustomError::NotFrozen
        );

        require!(
            self.user_account.amount_staked > 0,
            CustomError::NothingToUnstake
        );

        self.user_account.amount_staked = self
            .user_account
            .amount_staked
            .checked_sub(1)
            .ok_or(CustomError::Underflow)?;

        self.user_account.points = self
            .user_account
            .points
            .checked_add(self.config.points_per_stake as u32)
            .ok_or(CustomError::Overflow)?;

        let seeds: &[&[u8]] = &[b"config", &[self.config.bump]];
        let signer: &[&[&[u8]]; 1] = &[seeds];

        let cpi_accounts = Transfer {
            from: self.vault_ata.to_account_info(),
            to: self.user_nft_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let cpi_ctx =
            CpiContext::new_with_signer(self.token_program.to_account_info(), cpi_accounts, signer);

        transfer(cpi_ctx, 1)?;

        Ok(())
    }
}

