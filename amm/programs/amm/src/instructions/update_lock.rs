use anchor_lang::prelude::*;

use crate::state::Config;

#[derive(Accounts)]
pub struct UpdateLock<'info> {
    #[account(
        mut,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        constraint = authority.key() == config.authority.unwrap()
    )]
    pub authority: Signer<'info>,
}

impl<'info> UpdateLock<'info> {
    pub fn lock(&mut self) -> Result<()> {
        
        self.config.locked = true;
        Ok(())
    }

    pub fn unlock(&mut self) -> Result<()> {
        self.config.locked = false;
        Ok(())
    }
}