use std::{io::Write, fs::OpenOptions, path::Path};
use crate::functions::*;

use memmap2::Mmap;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,Runtime
};

use ring::aead::*;
pub fn decrypt(src_file_name: &str,dest_file_name: &str, key: &[u8],decrypt_in_place:bool)-> Result<String, String>  {
	let file = std::fs::File::open(src_file_name).unwrap();
    let mut buf = unsafe { Mmap::map(&file).unwrap().to_vec()  };
	
	
	let key = LessSafeKey::new(UnboundKey::new(&AES_256_GCM, &key).unwrap());
	let nonce_arr: [u8; 12] = buf[buf.len() - 12..buf.len()].try_into().unwrap();
	buf.truncate(buf.len() - 12);
	let nonce = Nonce::assume_unique_for_key(nonce_arr);

	match key.open_in_place(nonce, Aad::empty(), &mut buf) {
		Ok(_) => {},
		Err(e) => {
			println!("[Decrypt] Error decrypting file : {}", e );
			return Err("[Decrypt] Error decrypting file".to_string());
		}
	}
	buf.truncate(buf.len() - AES_256_GCM.tag_len());

	if decrypt_in_place {
		let mut file = OpenOptions::new().write(true).truncate(true).open(src_file_name).unwrap();
		file.write_all(&buf).unwrap();
		// rename the flie to remove the .dfort extension
		let mut new_file_name = src_file_name.to_string();
		new_file_name.truncate(new_file_name.len() - ".dfort".len());
		std::fs::rename(src_file_name, new_file_name).unwrap();
		return Ok("".to_string());
	}

	std::fs::create_dir_all(Path::new(dest_file_name).parent().unwrap()).unwrap();

	let mut file = OpenOptions::new().read(true).write(true).create(true).open(dest_file_name).unwrap();

	file.write_all(&buf).unwrap();
	Ok("".to_string())
}

#[tauri::command]
pub async fn decrypt_file<R: Runtime>(src_file_name: &str,dest_file_name: &str, password: &str,decrypt_in_place:bool,_app: AppHandle<R>) -> Result<String, String>  {
	
	let start_time = std::time::Instant::now();
    let my_key = get_key(password);
	
	let result = match decrypt(src_file_name,dest_file_name, &my_key,decrypt_in_place) {
        Ok(_) => Ok("Decryption successful".to_string()),
        Err(e) => Err(e),
    };
    println!("[Decrypt] Time elapsed for file {} : {:?}",src_file_name , start_time.elapsed());
	result
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("decrypt")
    .invoke_handler(tauri::generate_handler![
        decrypt_file
    ])
    .build()
}