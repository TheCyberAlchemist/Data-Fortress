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

pub fn generate_nonce() -> [u8; 12] {
    let mut nonce = [0u8; 12];
    let mut rng = thread_rng();
    rng.fill(&mut nonce);
    nonce
}

// pub fn get_key_nonce_hash(key: &str, nonce: &[u8]) -> [u8; 32] {
//     // let mut output = [0u8; 32];

//     // generate a hash of the input string
//     let mut hasher = Sha256::new();
//     hasher.update(key.as_bytes());
//     hasher.update(nonce);
//     let result = hasher.finalize();

//     // convert the hash to a u8 array
//     let mut output = [0u8; 32];
//     for (i, byte) in result.iter().enumerate() {
//         output[i] = *byte;
//     }

//     output
// }


// pub fn compute_hmac(key: &[u8], message: &[u8]) -> [u8; 32] {
//     let mut mac = HmacSha256::new_from_slice(key)
//     .expect("HMAC can take key of any size");
//     mac.update(message);
//     let result = mac.finalize().into_bytes();
//     let mut output = [0u8; 32];
//     for (i, byte) in result.iter().enumerate() {
//         output[i] = *byte;
//     }
//     output
// }
// pub fn verify_hmac(key: &[u8], hmac: &[u8], message: &Vec<u8>) -> bool{

//     let mut mac = HmacSha256::new_from_slice(key)
//     .expect("HMAC can take key of any size");
//     mac.update(message);
//     let result = mac.finalize().into_bytes();
//     let mut output = [0u8; 32];
//     for (i, byte) in result.iter().enumerate() {
//         output[i] = *byte;
//     }
    
//     output == hmac
    
// }

