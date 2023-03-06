use sha2::{Sha256, Digest};
use rand::{Rng, thread_rng};

pub fn get_key(input: &str) -> [u8; 32] {
    // let mut output = [0u8; 32];

    // generate a hash of the input string
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();

    // convert the hash to a u8 array
    let mut output = [0u8; 32];
    for (i, byte) in result.iter().enumerate() {
        output[i] = *byte;
    }

    output
}

pub fn get_key_nonce_hash(key: &str, nonce: &[u8]) -> [u8; 32] {
    // let mut output = [0u8; 32];

    // generate a hash of the input string
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    hasher.update(nonce);
    let result = hasher.finalize();

    // convert the hash to a u8 array
    let mut output = [0u8; 32];
    for (i, byte) in result.iter().enumerate() {
        output[i] = *byte;
    }

    output
}

pub fn generate_nonce() -> [u8; 24] {
    let mut nonce = [0u8; 24];
    let mut rng = thread_rng();
    rng.fill(&mut nonce);
    nonce
}
