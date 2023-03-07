use std::{path::Path,io::{Read, Seek, SeekFrom,Write}};
use crate::functions::*;
use crypto_api_chachapoly::{XChaCha20};
use rayon::prelude::*;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,Runtime
};

pub fn decrypt(file_name: &str,dest_file_name: &str,key: &[u8],chunk_size:usize)-> Result<String, String> {
	let mut buf = Vec::new();

	let mut file = std::fs::File::open(file_name).unwrap();

	// read the whole file into buff
	file.read_to_end(&mut buf).unwrap();

	// retrive the hash from the end of the file
	let _hash = buf.split_off(buf.len() - 32);

	// retrive and remove the nonce from the end of the file
	let nonce = buf.split_off(buf.len() - 24);

    buf.par_chunks_mut(chunk_size)
        .for_each(|chunk| {
			// clone the cipher
            let cipher = XChaCha20::cipher();
            let chunk_size = chunk.len();
            cipher.decrypt(chunk, chunk_size, key, &nonce).unwrap();
        });
	std::fs::create_dir_all(Path::new(dest_file_name).parent().unwrap()).unwrap();

	let mut dist_file = match std::fs::OpenOptions::new().write(true).create(true).open(dest_file_name) {
		Ok(file) => file,
		Err(e) => panic!("Failed to create file {}: {}", dest_file_name, e),
	};
	dist_file.write_all(&buf).unwrap();

	Ok("Decryption successful".to_string())

}

#[tauri::command]
pub async fn decrypt_file<R: Runtime>(src_file_name: &str,dest_file_name: &str, password: &str,chunk_size:usize,_app: AppHandle<R>) -> Result<String, String>  {
    let my_key = get_key(password);
	// println!("Here at decrypt_file: {:?}",src_file_name);
	let mut buf = Vec::new();
	
	let mut file = std::fs::File::open(src_file_name).unwrap();
	
	// read the last 32 + 24 bytes of the file
	file.seek(SeekFrom::End(-(32+24) as i64)).unwrap();
	file.read_to_end(&mut buf).unwrap();
	
	let hash = buf.split_off(buf.len() - 32);
	
	let nonce = buf.split_off(buf.len() - 24);	

	if hash != get_key_nonce_hash(&password, &nonce) {
		println!("Password is not correct");
		return Err("Password is not correct".to_string())
	}
	println!("Password is correct");
	let result = match decrypt(src_file_name,dest_file_name, &my_key,chunk_size) {
        Ok(_) => Ok("Decryption successful".to_string()),
        Err(e) => Err(e),
    };
    // decrypt(src_file_name,dest_file_name, &my_key,chunk_size);
    // Ok("Done".to_string())
	result
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("decrypt")
    .invoke_handler(tauri::generate_handler![
        decrypt_file
    ])
    .build()
}