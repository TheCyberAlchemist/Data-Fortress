use std::{path::{PathBuf,Path},io::{Read, Write}};
// import all the functions from the functions.rs file
use crate::functions::*;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,Runtime
};
use crypto_api_chachapoly::{XChaCha20};
use rayon::prelude::*;


fn encrypt(src_file_name: &str,dest_file_name: &str, key: &[u8],chunk_size:usize,password: &str)-> Result<String, String>  {
    // convert message to bytes
    let mut buf = Vec::new();
	
	let nonce = &generate_nonce();

    let mut file = std::fs::File::open(src_file_name).unwrap();

    file.read_to_end(&mut buf).unwrap();

    buf.par_chunks_mut(chunk_size)
        .for_each(|chunk| {
			
            let cipher = XChaCha20::cipher();
            let chunk_size = chunk.len();
            cipher.encrypt(chunk, chunk_size, key, nonce).unwrap();

        });

	
    // write the encrypted buffer to a file
    
    std::fs::create_dir_all(Path::new(dest_file_name).parent().unwrap()).unwrap();
    
    let mut dist_file = match std::fs::OpenOptions::new().write(true).create(true).open(dest_file_name) {
        Ok(file) => file,
        Err(e) => panic!("Failed to create file {}: {}", dest_file_name, e),
    };
    dist_file.write_all(&buf).unwrap();

    // append the nonce to the end of the file
    // let mut dist_file = std::fs::OpenOptions::new().append(true).open(dest_file_name).unwrap(); 
    dist_file.write_all(nonce).unwrap();
    // println!("[Encrypt] nonce : {:?}", nonce);
    
    let hash = get_key_nonce_hash(&password, nonce);
    // let mut dist_file = std::fs::OpenOptions::new().append(true).open(dest_file_name).unwrap();
    dist_file.write_all(&hash).unwrap();
    // println!("[Encrypt] hash : {:?}", hash);
    Ok("Encryption successful".to_string())
}

#[tauri::command]
pub async fn encrypt_file<R: Runtime>(src_file_name: &str,dest_file_name: &str, password: &str,chunk_size:usize,_app: AppHandle<R>) -> Result<String, String>  {
    let my_key = get_key(password);

    let result = match encrypt(src_file_name,dest_file_name, &my_key,chunk_size,&password) {
        Ok(_) => Ok("Encryption successful".to_string()),
        Err(e) => Err(e),
    };
    result
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("encrypt")
    .invoke_handler(tauri::generate_handler![
        encrypt_file
    ])
    .build()
}