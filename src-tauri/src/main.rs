#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod functions;
mod encrypt;
mod decrypt;

// mod test;
fn main() {
  tauri::Builder::default()
    .plugin(encrypt::init())
    .plugin(decrypt::init())
    .plugin(functions::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
