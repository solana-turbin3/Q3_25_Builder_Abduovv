use anchor_lang::prelude::*;

mod instructions;
use instructions::*;
mod state;
use state::*;

use crate::*;
declare_id!("FxCvuhL6HDJsPhAQJ6pstNPy8XneHw1nrh5baswVWMRW");

#[program]
pub mod escrow {
    use super::*;
    pub fn make(ctx: Context<Make>, id: u64, receive: u64, deposit: u64) -> Result<()> {
        ctx.accounts.init_escrow(id, receive, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)?;
        Ok(())
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;

        Ok(())
    }
}