use std::{io::Write, fs::OpenOptions, path::Path};
use memmap2::Mmap;
use crate::functions::*;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,Runtime
};
use ring::aead::*;

pub fn encrypt(src_file_name: &str,dest_file_name: &str, key: &[u8],encrypt_in_place:bool)-> Result<String, String>  {
    println!("[Encrypt] Encrypting file: {}", src_file_name);
    // let start_time = std::time::Instant::now();
    let file = std::fs::File::open(src_file_name).unwrap();
    let mut buf = unsafe { Mmap::map(&file).unwrap().to_vec()  };
	// println!("[Encrypt] Time taken for reading file: {}ms", start_time.elapsed().as_millis());
    
	// let start_time = std::time::Instant::now();
	
    let key = LessSafeKey::new(UnboundKey::new(&AES_256_GCM, &key).unwrap());
	let nonce_arr = generate_nonce();
	let nonce = Nonce::assume_unique_for_key(nonce_arr);
	key.seal_in_place_append_tag(nonce, Aad::empty(), &mut buf)
	.unwrap();
    buf.append(&mut nonce_arr.to_vec());

    if encrypt_in_place {
        // if encrypt in place, overwrite the file and rename it to .dfort
        let mut file = OpenOptions::new().read(true).write(true).create(true).open(src_file_name).unwrap();
        file.write_all(&buf).unwrap();
        // rename the file to .dfort
        let mut new_file_name = src_file_name.to_string();
        new_file_name.push_str(".dfort");
        std::fs::rename(src_file_name, new_file_name).unwrap();
        return Ok("".to_string());
    }
    
    std::fs::create_dir_all(Path::new(dest_file_name).parent().unwrap()).unwrap();
    let mut file = OpenOptions::new().read(true).write(true).create(true).open(dest_file_name).unwrap();
    file.write_all(&buf).unwrap();

    Ok("".to_string())
}

#[tauri::command]
pub async fn encrypt_file<R: Runtime>(src_file_name: &str,dest_file_name: &str, password: &str,encrypt_in_place:bool,_app: AppHandle<R>) -> Result<String, String>  {
    let my_key = get_key(password);
    
    let start_time = std::time::Instant::now();
    let _result = match encrypt(src_file_name,dest_file_name, &my_key, encrypt_in_place) {
        Ok(_) => Ok("".to_string()),
        Err(e) => Err(e.to_string()),
    };
    let end_time = std::time::Instant::now();
    println!("[Encrypt] Time elapsed for file {} is: {:?}", src_file_name , end_time.duration_since(start_time));
    
    _result
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("encrypt")
    .invoke_handler(tauri::generate_handler![
        encrypt_file
    ])
    .build()
}