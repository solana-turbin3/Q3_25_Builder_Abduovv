use crate::fuzz_transactions::FuzzAccounts;
use crate::types::*;
use borsh::{BorshDeserialize, BorshSerialize};
use trident_fuzz::fuzzing::*;
#[derive(Arbitrary, TridentInstruction)]
#[program_id("2HF8oxRi9zuJo3J3CCqgXvKzUrjLXSzu6xa5qPMq1ksg")]
# [discriminator ([248u8 , 198u8 , 158u8 , 145u8 , 225u8 , 117u8 , 135u8 , 200u8 ,])]
pub struct SwapInstruction {
    pub accounts: SwapInstructionAccounts,
    pub data: SwapInstructionData,
}
/// Instruction Accounts
#[derive(Arbitrary, Debug, Clone, TridentAccounts)]
#[instruction_data(SwapInstructionData)]
#[storage(FuzzAccounts)]
pub struct SwapInstructionAccounts {
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
    user_x: TridentAccount,
    #[account(mut)]
    user_y: TridentAccount,
    #[account(address = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")]
    token_program: TridentAccount,
    #[account(address = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")]
    associated_token_program: TridentAccount,
    #[account(address = "11111111111111111111111111111111")]
    system_program: TridentAccount,
}
/// Instruction Data
#[derive(Arbitrary, Debug, BorshDeserialize, BorshSerialize, Clone)]
pub struct SwapInstructionData {
    amount_in: u64,
    min_amount_out: u64,
    x_to_y: bool,
}
/// Implementation of instruction setters for fuzzing
///
/// Provides methods to:
/// - Set instruction data during fuzzing
/// - Configure instruction accounts during fuzzing
/// - (Optional) Set remaining accounts during fuzzing
///
/// Docs: https://ackee.xyz/trident/docs/latest/start-fuzzing/writting-fuzz-test/
impl InstructionHooks for SwapInstruction {
    type IxAccounts = FuzzAccounts;
    fn set_data(&mut self, client: &mut impl FuzzClient, fuzz_accounts: &mut Self::IxAccounts) {
        todo!()
    }
    fn set_accounts(&mut self, client: &mut impl FuzzClient, fuzz_accounts: &mut Self::IxAccounts) {
        todo!()
    }
}
