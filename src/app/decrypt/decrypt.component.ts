import { Component, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { DirObj, FileObj, SharedFunctionsService } from '../shared-functions.service';

@Component({
	selector: 'app-decrypt',
	templateUrl: './decrypt.component.html',
	styleUrls: ['./decrypt.component.scss']
})
export class DecryptComponent implements OnInit {

	constructor(public shared_functions: SharedFunctionsService) { }

	ngOnInit(): void {
	}
	decryption_selected_files: FileObj[] = [];
	decryption_selected_folder: string = "";
	decryption_destination_folder: string = this.shared_functions.BASE_DIR + "\\Decrypt";
	decrypt_dir_obj: DirObj[] = [];
	decryption_success: boolean = false;
	decrypt_errors: string[] = [];

	get_relative_decrypted_file_path(file_path: string, src_folder: string = ""): string {
		// console.log("file_name :: ", file_path);
		// console.log("src_folder :: ", src_folder);

		if (src_folder == "") {
			// if file is selected directly

			// remove all folder ref from the file_name
			let relative_path = file_path.split("\\").pop();
			// remove the .encrypted extension
			if (relative_path == undefined)
				return "";
			relative_path = relative_path.split(".encrypted")[0];
			return `${relative_path}`;
		}

		let selected_folder_name = src_folder.split("\\").pop();

		let relative_path = file_path.replace(src_folder, "");
		// change the slashes to backslashes "path/asdf" -> "path\\asdf
		relative_path = relative_path.replace(/\//g, "\\");
		// remove the first slash "/pathasdf" -> "pathasdf
		relative_path = relative_path.substring(1);
		// remove the .encrypted extension "path.asdf.encrypted" -> "path.asdf"
		relative_path = relative_path.split(".encrypted")[0];
		relative_path = `${selected_folder_name}\\${relative_path}`;
		return relative_path;
	}
	get_decrypted_file_name(file_path: string) {
		// add _decrypted to the file name
		let file_name = file_path.split("\\").slice(-1)[0];
		return `${file_name.split(".")[0]}_decrypted.${file_name.split(".")[1]}`;
	}

	select_files_to_decrypt() {
		// console.log(this.get_relative_encrypted_file_path("D:\\Somewhere\\Tests\\Rust Encryptions\\try3\\Trial\\Dir_2\\Dir_1\\New Text Document.txt","D:\\Somewhere\\Tests\\Rust Encryptions\\try3\\Trial\\Dir_2"))
		this.shared_functions.open_files_select_dialogue()
			.then((result: any) => {
				console.log(result);
				let all_files: FileObj[] = result.map((file: any) => { return { path: file } });
				console.log(all_files);
				this.decryption_selected_files = this.shared_functions.set_file_properties_from_file_arr(all_files);
			}
			).catch((err: any) => {
				console.log(err);
			});
	}
	select_folder_to_decrypt() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR + "\\Encrypt").then((result: any) => {
			this.decryption_selected_folder = result;
			// console.log(this.getAllFiles(this.encryption_selected_folder,[]));
			readDir(this.decryption_selected_folder, { recursive: true, }).then((entries: any) => {
				// console.log(this.get_relative_encrypted_file_path(entries,this.encryption_selected_folder));
				this.decrypt_dir_obj = entries;
				this.shared_functions.set_file_size_in_dir(entries);
				this.decryption_selected_files = this.shared_functions.get_all_files_from_dir(entries);
			})
		})
	}
	select_decryption_destination_folder() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR)
			.then((result: any) => {
				console.log(result);
				this.decryption_destination_folder = result;
			})
	}

	decrypt_all() {
		let completed = 0;
		if (this.decryption_selected_files.length == 0) {
			this.decrypt_errors.push("No files selected");
			console.log("No files selected");
		}
		if (this.decryption_destination_folder == "") {
			this.decrypt_errors.push("No destination folder selected");
			console.log("No destination folder selected");
		}
		if (this.decrypt_dir_obj.length == 0) {
			// if files are selected directly
			for (let file of this.decryption_selected_files) {
				console.log("Command sent for file :: ", file);
				invoke(`plugin:decrypt|decrypt_file`, {
					srcFileName: file.path,
					destFileName: `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file.path, this.decryption_selected_folder)}`,
					password: this.shared_functions.key,
					chunkSize: 500,
				}).then(
					(result: any) => {
						completed += 1;
						console.log("Completed :: ", result);
						if (completed == this.decryption_selected_files.length) {
							this.decryption_success = true;
						}
					}
				).catch((err: any) => {
					this.decrypt_errors.push(err);
					console.log("Error in Decryption :: ", err);
				})
			}
			return;
		}
		// if directory is selected
		for (let file of this.decryption_selected_files) {
			console.log("Command sent for file :: ", file);
			console.log("Destination :: ", `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file.path, this.decryption_selected_folder)}`);
			invoke(`plugin:decrypt|decrypt_file`, {
				srcFileName: file.path,
				destFileName: `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file.path, this.decryption_selected_folder)}`,
				password: this.shared_functions.key,
				chunkSize: 500,
			}).then(
				(result: any) => {
					completed += 1;
					console.log("Completed :: ", completed);
					if (completed == this.decryption_selected_files.length) {
						this.decryption_success = true;
					}
				}
			)
		}

	}
}
