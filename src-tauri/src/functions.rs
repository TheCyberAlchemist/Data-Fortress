use sha2::{Sha256, Digest};
use rand::{Rng, thread_rng};
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,Runtime
};
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

#[tauri::command]
pub fn get_file_size<R: Runtime>(file_name: &str,_app: AppHandle<R>) -> Result<u64, String> {
    let metadata = std::fs::metadata(file_name).unwrap();
    let file_size = metadata.len();
    Ok(file_size)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("functions")
    .invoke_handler(tauri::generate_handler![
        get_file_size
    ])
    .build()
}