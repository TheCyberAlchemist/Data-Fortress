use std::{fs::{remove_file, OpenOptions}, io::{SeekFrom, Seek, Write}};

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

fn shred_file_asd(path: &str) -> std::io::Result<()> {
    let mut file = OpenOptions::new()
        .write(true)
        .open(path)?;

    let file_size = file.metadata()?.len();
    let mut rng = rand::thread_rng();

    // Overwrite the file with random data
    const BUFFER_SIZE: usize = 1024;
    let mut buffer = vec![0u8; BUFFER_SIZE];
    for i in 0..(file_size / BUFFER_SIZE as u64) {
        rng.fill(&mut buffer[..]);
        file.seek(SeekFrom::Start(i * BUFFER_SIZE as u64))?;
        file.write_all(&buffer)?;
    }

    // Overwrite the remaining bytes with a random byte
    let remaining_bytes = (file_size % BUFFER_SIZE as u64) as usize;
    if remaining_bytes > 0 {
        rng.fill(&mut buffer[..remaining_bytes]);
        file.seek(SeekFrom::Start(file_size - remaining_bytes as u64))?;
        file.write_all(&buffer[..remaining_bytes])?;
    }

    // Truncate the file to its original size
    file.set_len(file_size)?;

    // Sync the changes to disk
    file.sync_all()?;

    Ok(())
}
#[tauri::command]
pub fn shred_file<R: Runtime>(path: &str,_app: AppHandle<R>) -> Result<String,String> {
    
    match shred_file_asd(path) {
        Ok(_) => println!("File Shredded"),
        Err(e) => println!("Error: {}", e),
    }
    remove_file(path).unwrap();

    Ok("File Shredded".to_string())
}
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("functions")
    .invoke_handler(tauri::generate_handler![
        get_file_size,
        shred_file,
    ])
    .build()
}