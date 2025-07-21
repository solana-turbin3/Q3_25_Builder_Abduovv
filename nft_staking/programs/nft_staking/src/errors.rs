use anchor_lang::error_code;

#[error_code]
pub enum CustomError {
    #[msg("Not frozen")]
    NotFrozen,
    #[msg("Nothing to unstake")]
    NothingToUnstake,
    #[msg("Underflow")]
    Underflow,
    #[msg("Overflow")]
    Overflow,
    #[msg("No rewards to claim")]
    NoRewardsToClaim
}