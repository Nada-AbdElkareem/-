// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::net::TcpStream;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

struct ServerState(Mutex<Option<Child>>);

/// Poll localhost:3457 until the server is ready (max ~20 seconds)
fn wait_for_server(port: u16) -> bool {
    for _ in 0..40 {
        if TcpStream::connect(format!("127.0.0.1:{}", port)).is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    false
}

fn main() {
    tauri::Builder::default()
        .manage(ServerState(Mutex::new(None)))
        .setup(|app| {
            let resource_dir = app
                .path()
                .resource_dir()
                .expect("Failed to get resource dir");

            // server.exe lives next to the app resources
            let server_exe = resource_dir.join("server.exe");

            // User data dir for the SQLite DB (writable on all systems)
            let app_data = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            std::fs::create_dir_all(&app_data).ok();

            let db_path = app_data.join("sqlite_db.db");
            let dist_path = resource_dir.join("dist");

            // Launch the bundled Express server
            let child = Command::new(&server_exe)
                .env("PORT", "3457")
                .env("NODE_ENV", "production")
                .env("DB_PATH", db_path.to_str().unwrap_or(""))
                .env("DIST_PATH", dist_path.to_str().unwrap_or(""))
                .spawn()
                .expect("Failed to start backend server");

            *app.state::<ServerState>().0.lock().unwrap() = Some(child);

            // Wait for server, then open the main window
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                if wait_for_server(3457) {
                    tauri::WebviewWindowBuilder::new(
                        &handle,
                        "main",
                        tauri::WebviewUrl::External(
                            "http://localhost:3457".parse().unwrap(),
                        ),
                    )
                    .title("نظام إدارة دار الضيافة الطبية")
                    .inner_size(1440.0, 900.0)
                    .min_inner_size(1024.0, 700.0)
                    .build()
                    .unwrap();
                } else {
                    eprintln!("Server failed to start in time");
                }
            });

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                std::process::exit(0);
            }
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
