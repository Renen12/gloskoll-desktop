use std::env::current_dir;
use std::process::Command;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn start_pb() {
    println!("{}", current_dir().unwrap().to_str().unwrap());
    Command::new("../../../../src/pocketbase.exe")
        .args(["serve"])
        .spawn()
        .unwrap();
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![start_pb])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
