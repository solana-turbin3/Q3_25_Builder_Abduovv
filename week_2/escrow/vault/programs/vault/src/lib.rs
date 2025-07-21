#![allow(deprecated)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::{system_program::{Transfer, transfer}};

// Declare the program ID for this smart contract
declare_id!("DYti6i44SscFmSX5mKG8wDmR6SURzR8LHnrtXpPePC1C");

#[program]
pub mod vault {
    use super::*;

    // Initializes the vault state and vault accounts for a specific user
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)
    }

    // Allows a user to deposit SOL into their vault account
    pub fn deposit(ctx: Context<Payment>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    // Allows a user to withdraw SOL from their vault account
    pub fn withdraw(ctx: Context<Payment>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw(amount)
    }

    // Allows the user to close their vault and reclaim remaining SOL
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close()
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // User initializing the vault

    // PDA account storing bump seeds for vault and state
    #[account(
        init,
        payer = user,
        space = VaultState::INIT_SPACE,
        seeds = [b"state", user.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,

    // PDA that will hold the SOL for the vault
    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>, // System program used for account creation & transfers
}

#[derive(Accounts)]
pub struct Payment<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // User performing deposit or withdrawal

    // Existing vault state PDA derived using the user's key
    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump
    )]
    pub vault_state: Account<'info, VaultState>,

    // Vault PDA holding the SOL, derived from vault state
    #[account(
        mut,
        seeds = [b"vault", vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>, // Required for transfer CPI
}

impl<'info> Payment<'info> {
    // Deposits SOL from the user to the vault account
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cpl_program: AccountInfo<'_> = self.system_program.to_account_info();

        let cpl_accounts: Transfer<'_> = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info()
        };

        let cpl_ctx = CpiContext::new(cpl_program, cpl_accounts);

        transfer(cpl_ctx, amount)
    }

    // Withdraws SOL from the vault to the user, signed by vault PDA
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let cpl_program: AccountInfo<'_> = self.system_program.to_account_info();

        let cpl_accounts: Transfer<'_> = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info()
        };

        // Derive signer seeds for vault PDA to authorize the transfer
        let seeds: &[&[u8]; 3] = &[
            b"vault",
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        let signer_seeds: &[&[&[u8]]; 1] = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(cpl_program, cpl_accounts, signer_seeds);

        transfer(cpi_ctx, amount)
    }
}

impl<'info> Initialize<'info> {
    // Handles initialization logic: funds vault with rent-exempt balance, saves bump seeds
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        // Get the minimum lamports needed for rent exemption
        let rent_exempt: u64 = Rent::get()?.minimum_balance(self.vault.to_account_info().data_len());

        let cpl_program: AccountInfo<'_> = self.system_program.to_account_info();

        let cpl_accounts: Transfer<'_> = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info()
        };

        let cpl_ctx = CpiContext::new(cpl_program, cpl_accounts);

        // Fund vault with rent-exempt amount
        transfer(cpl_ctx, rent_exempt)?;

        // Save the bump values into the state account
        self.vault_state.vault_bump = bumps.vault;
        self.vault_state.state_bump = bumps.vault_state;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Close<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // The owner of the vault

    // Vault state PDA to be closed (refunds lamports to user)
    #[account(
        mut,
        seeds = [b"state", user.key().as_ref()],
        bump = vault_state.state_bump,
        close = user,
    )]
    pub vault_state: Account<'info, VaultState>,

    // Vault PDA holding lamports, will transfer remaining SOL back to user
    #[account(
        mut,
        seeds = [b"vault",vault_state.key().as_ref()],
        bump = vault_state.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>, // For CPI transfer
}

impl<'info> Close<'info> {
    // Closes the vault by transferring all remaining SOL back to user
    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.system_program.to_account_info();

        let cpi_account = Transfer {
            from: self.vault.to_account_info(),
            to: self.user.to_account_info(),
        };

        // PDA signer seeds for the vault account
        let seeds = &[
            b"vault",
            self.vault_state.to_account_info().key.as_ref(),
            &[self.vault_state.vault_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        // Transfer all remaining lamports to the user
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_account, signer_seeds);
        transfer(cpi_ctx, self.vault.lamports())?;
        Ok(())
    }
}

#[account]
// Account that stores bump seeds used to sign for vault and state PDAs
pub struct VaultState {
    pub vault_bump: u8,      // Bump for vault PDA
    pub state_bump: u8,      // Bump for state PDA
}

// Custom implementation of the Space trait to define space needed for VaultState
impl Space for VaultState {
    // 8 bytes for discriminator + 2 bytes (2 u8 fields)
    const INIT_SPACE: usize = 8 + 1 * 2;
}
