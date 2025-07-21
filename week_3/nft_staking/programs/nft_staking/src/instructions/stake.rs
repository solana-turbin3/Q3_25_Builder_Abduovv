use crate::states::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, StakeConfig>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = user,
    )]
    pub user_nft_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"vault", nft_mint.key().as_ref()],
        bump,
        token::mint = nft_mint,
        token::authority = config,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        seeds = [b"stake", user.key().as_ref(), nft_mint.key().as_ref()],
        bump,
        space = 8 + StakeAccount::INIT_SPACE,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> Stake<'info> {
    pub fn stake(&mut self, bumps: StakeBumps) -> Result<()> {
        let clock = Clock::get()?;

        self.stake_account.set_inner(StakeAccount {
            owner: self.user.key(),
            mint: self.nft_mint.key(),
            stake_at: clock.unix_timestamp,
            bump: bumps.stake_account,
        });

        self.user_account.amount_staked = self.user_account.amount_staked.saturating_add(1);

        let cpi_accounts = Transfer {
            from: self.user_nft_ata.to_account_info(),
            to: self.vault_ata.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        transfer(cpi_ctx, 1)?;

        Ok(())
    }
}

