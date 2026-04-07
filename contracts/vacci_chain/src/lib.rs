#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Symbol, Vec,
};

// ── Storage keys ──────────────────────────────────────────────────────────────
const ADMIN: Symbol = symbol_short!("ADMIN");
const ISSUERS: Symbol = symbol_short!("ISSUERS");

#[contracttype]
#[derive(Clone)]
pub struct VaccinationRecord {
    pub patient:      Address,
    pub vaccine_name: String,
    pub issuer:       Address,
    pub date:         u64,   // Unix timestamp
    pub token_id:     u64,
}

#[contracttype]
pub enum DataKey {
    Record(u64),          // token_id → VaccinationRecord
    PatientTokens(Address), // patient → Vec<u64>
    NextId,
}

// ── Contract ──────────────────────────────────────────────────────────────────
#[contract]
pub struct VacciChain;

#[contractimpl]
impl VacciChain {
    // ── Init ──────────────────────────────────────────────────────────────────
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&ISSUERS, &Vec::<Address>::new(&env));
    }

    // ── Admin helpers ─────────────────────────────────────────────────────────
    fn require_admin(env: &Env) -> Address {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();
        admin
    }

    pub fn add_issuer(env: Env, issuer: Address) {
        Self::require_admin(&env);
        let mut issuers: Vec<Address> = env.storage().instance().get(&ISSUERS).unwrap();
        issuers.push_back(issuer);
        env.storage().instance().set(&ISSUERS, &issuers);
    }

    pub fn remove_issuer(env: Env, issuer: Address) {
        Self::require_admin(&env);
        let issuers: Vec<Address> = env.storage().instance().get(&ISSUERS).unwrap();
        let mut updated = Vec::<Address>::new(&env);
        for i in 0..issuers.len() {
            let a = issuers.get(i).unwrap();
            if a != issuer {
                updated.push_back(a);
            }
        }
        env.storage().instance().set(&ISSUERS, &updated);
    }

    fn require_issuer(env: &Env, caller: &Address) {
        caller.require_auth();
        let issuers: Vec<Address> = env.storage().instance().get(&ISSUERS).unwrap();
        for i in 0..issuers.len() {
            if issuers.get(i).unwrap() == *caller {
                return;
            }
        }
        panic!("not an authorized issuer");
    }

    // ── Mint (soulbound) ──────────────────────────────────────────────────────
    pub fn mint(
        env: Env,
        issuer:       Address,
        patient:      Address,
        vaccine_name: String,
        date:         u64,
    ) -> u64 {
        Self::require_issuer(&env, &issuer);

        let token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let record = VaccinationRecord {
            patient: patient.clone(),
            vaccine_name,
            issuer,
            date,
            token_id,
        };

        env.storage().persistent().set(&DataKey::Record(token_id), &record);

        // Append to patient's token list
        let mut tokens: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::PatientTokens(patient.clone()))
            .unwrap_or(Vec::new(&env));
        tokens.push_back(token_id);
        env.storage().persistent().set(&DataKey::PatientTokens(patient), &tokens);

        env.storage().instance().set(&DataKey::NextId, &(token_id + 1));
        token_id
    }

    // ── Query ─────────────────────────────────────────────────────────────────
    pub fn get_record(env: Env, token_id: u64) -> VaccinationRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Record(token_id))
            .expect("record not found")
    }

    pub fn get_patient_tokens(env: Env, patient: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::PatientTokens(patient))
            .unwrap_or(Vec::new(&env))
    }

    pub fn verify(env: Env, patient: Address, vaccine_name: String) -> bool {
        let tokens: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::PatientTokens(patient.clone()))
            .unwrap_or(Vec::new(&env));

        for i in 0..tokens.len() {
            let tid = tokens.get(i).unwrap();
            let rec: VaccinationRecord = env
                .storage()
                .persistent()
                .get(&DataKey::Record(tid))
                .unwrap();
            if rec.vaccine_name == vaccine_name {
                return true;
            }
        }
        false
    }

    pub fn is_issuer(env: Env, address: Address) -> bool {
        let issuers: Vec<Address> = env.storage().instance().get(&ISSUERS).unwrap_or(Vec::new(&env));
        for i in 0..issuers.len() {
            if issuers.get(i).unwrap() == address {
                return true;
            }
        }
        false
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────
#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_mint_and_verify() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VacciChain);
        let client = VacciChainClient::new(&env, &contract_id);

        let admin   = Address::generate(&env);
        let issuer  = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        client.add_issuer(&issuer);

        let tid = client.mint(
            &issuer,
            &patient,
            &String::from_str(&env, "COVID-19"),
            &1_700_000_000u64,
        );
        assert_eq!(tid, 0);

        let rec = client.get_record(&0);
        assert_eq!(rec.vaccine_name, String::from_str(&env, "COVID-19"));

        assert!(client.verify(&patient, &String::from_str(&env, "COVID-19")));
        assert!(!client.verify(&patient, &String::from_str(&env, "Flu")));
    }

    #[test]
    #[should_panic(expected = "not an authorized issuer")]
    fn test_unauthorized_mint() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, VacciChain);
        let client = VacciChainClient::new(&env, &contract_id);

        let admin   = Address::generate(&env);
        let rogue   = Address::generate(&env);
        let patient = Address::generate(&env);

        client.initialize(&admin);
        client.mint(&rogue, &patient, &String::from_str(&env, "COVID-19"), &0);
    }
}
