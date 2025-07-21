use fuzz_transactions::*;
use trident_fuzz::fuzzing::*;
mod fuzz_transactions;
mod instructions;
mod transactions;
mod types;
use amm::entry as entry_amm;
pub use transactions::*;
#[derive(Default)]
struct FuzzTest<C> {
    client: C,
}
/// Use flows to specify custom sequences of behavior
/// #[init]
/// fn start(&mut self) {
///     // Initialization goes here
/// }
/// #[flow]
/// fn flow1(
///     &mut self,
///     fuzzer_data: &mut FuzzerData,
///     accounts: &mut FuzzAccounts,
/// ) -> Result<(), FuzzingError> {
///     // Flow logic goes here
///     Ok(())
/// }
#[flow_executor]
impl<C: FuzzClient + std::panic::RefUnwindSafe> FuzzTest<C> {
    fn new(client: C) -> Self {
        Self { client }
    }
    #[init]
    fn start(&mut self) {
        self.client.deploy_native_program(ProgramEntrypoint::new(
            pubkey!("2HF8oxRi9zuJo3J3CCqgXvKzUrjLXSzu6xa5qPMq1ksg"),
            None,
            processor!(entry_amm),
        ));
    }
}
fn main() {
    let client = TridentSVM::new_client(&[], &TridentConfig::new());
    FuzzTest::new(client).fuzz();
}
