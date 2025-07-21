use crate::fuzz_transactions::FuzzAccounts;
use crate::types::*;
use borsh::{BorshDeserialize, BorshSerialize};
use trident_fuzz::fuzzing::*;
#[derive(Arbitrary, TridentInstruction)]
#[program_id("2HF8oxRi9zuJo3J3CCqgXvKzUrjLXSzu6xa5qPMq1ksg")]
# [discriminator ([242u8 , 35u8 , 198u8 , 137u8 , 82u8 , 225u8 , 242u8 , 182u8 ,])]
pub struct DepositInstruction {
    pub accounts: DepositInstructionAccounts,
    pub data: DepositInstructionData,
}
/// Instruction Accounts
#[derive(Arbitrary, Debug, Clone, TridentAccounts)]
#[instruction_data(DepositInstructionData)]
#[storage(FuzzAccounts)]
pub struct DepositInstructionAccounts {
    #[account(mut, signer)]
    user: TridentAccount,
    mint_x: TridentAccount,
    mint_y: TridentAccount,
    config: TridentAccount,
    #[account(mut)]
    vault_x: TridentAccount,
    #[account(mut)]
    vault_y: TridentAccount,
    #[account(mut)]
    mint_lp: TridentAccount,
    #[account(mut)]
    user_x: TridentAccount,
    #[account(mut)]
    user_y: TridentAccount,
    #[account(mut)]
    user_lp: TridentAccount,
    #[account(address = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")]
    token_program: TridentAccount,
    #[account(address = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")]
    associated_token_program: TridentAccount,
    #[account(address = "11111111111111111111111111111111")]
    system_program: TridentAccount,
}
/// Instruction Data
#[derive(Arbitrary, Debug, BorshDeserialize, BorshSerialize, Clone)]
pub struct DepositInstructionData {
    amount: u64,
    max_x: u64,
    max_y: u64,
}
/// Implementation of instruction setters for fuzzing
///
/// Provides methods to:
/// - Set instruction data during fuzzing
/// - Configure instruction accounts during fuzzing
/// - (Optional) Set remaining accounts during fuzzing
///
/// Docs: https://ackee.xyz/trident/docs/latest/start-fuzzing/writting-fuzz-test/
impl InstructionHooks for DepositInstruction {
    type IxAccounts = FuzzAccounts;
    fn set_data(&mut self, client: &mut impl FuzzClient, fuzz_accounts: &mut Self::IxAccounts) {
        todo!()
    }
    fn set_accounts(&mut self, client: &mut impl FuzzClient, fuzz_accounts: &mut Self::IxAccounts) {
        todo!()
    }
}
