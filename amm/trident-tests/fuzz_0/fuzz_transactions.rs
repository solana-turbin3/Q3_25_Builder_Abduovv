use crate::transactions::*;
use trident_fuzz::fuzzing::*;
/// FuzzTransactions contains all available transactions
///
/// You can create your own transactions by adding new variants to the enum.
///
/// Docs: https://ackee.xyz/trident/docs/latest/trident-api-macro/trident-types/fuzz-transactions/
#[derive(Arbitrary, TransactionSelector)]
pub enum FuzzTransactions {
    DepositTransaction(DepositTransaction),
    InitializeTransaction(InitializeTransaction),
    SwapTransaction(SwapTransaction),
}
/// FuzzAccounts contains all available accounts
///
/// You can create your own accounts by adding new fields to the struct.
///
/// Docs: https://ackee.xyz/trident/docs/latest/trident-api-macro/trident-types/fuzz-accounts/
#[derive(Default)]
pub struct FuzzAccounts {
    pub mint_lp: AccountsStorage,
    pub user_y: AccountsStorage,
    pub mint_x: AccountsStorage,
    pub user_x: AccountsStorage,
    pub user_lp: AccountsStorage,
    pub config: AccountsStorage,
    pub associated_token_program: AccountsStorage,
    pub initializer: AccountsStorage,
    pub user: AccountsStorage,
    pub vault_y: AccountsStorage,
    pub vault_x: AccountsStorage,
    pub system_program: AccountsStorage,
    pub mint_y: AccountsStorage,
    pub token_program: AccountsStorage,
}
