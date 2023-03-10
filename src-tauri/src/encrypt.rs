use std::{io::Write, fs::OpenOptions, path::Path};
use memmap2::Mmap;
use crate::functions::*;
use tauri::{
    plugin::{Builder, TauriPlugin},
    AppHandle,Runtime
};
use ring::aead::*;

pub fn encrypt(src_file_name: &str,dest_file_name: &str, key: &[u8],_chunk_size:usize)-> Result<String, String>  {
    println!("[Encrypt] [Mmap] Encrypting file: {}", src_file_name);    
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
	
	// println!("[Encrypt] Time taken for encryption: {}ms", start_time.elapsed().as_millis());
    
    std::fs::create_dir_all(Path::new(dest_file_name).parent().unwrap()).unwrap();
	
    // let start_time = std::time::Instant::now();
    
    buf.append(&mut nonce_arr.to_vec());
    let mut file = OpenOptions::new().read(true).write(true).create(true).open(dest_file_name).unwrap();
    
    // // file write
    file.write_all(&buf).unwrap();
	// println!("[Encrypt] Time taken for writing file: {}ms", start_time.elapsed().as_millis());
    Ok("".to_string())
}

#[tauri::command]
pub async fn encrypt_file<R: Runtime>(src_file_name: &str,dest_file_name: &str, password: &str,chunk_size:usize,_app: AppHandle<R>) -> Result<String, String>  {
    let my_key = get_key(password);
    
    let start_time = std::time::Instant::now();
    let _result = match encrypt(src_file_name,dest_file_name, &my_key,chunk_size) {
        Ok(_) => Ok("".to_string()),
        Err(e) => Err(e.to_string()),
    };
    let end_time = std::time::Instant::now();
    println!("[Encrypt] [Mmap] Time elapsed for file {} is: {:?}", src_file_name , end_time.duration_since(start_time));
    
    _result
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("encrypt")
    .invoke_handler(tauri::generate_handler![
        encrypt_file
    ])
    .build()
}