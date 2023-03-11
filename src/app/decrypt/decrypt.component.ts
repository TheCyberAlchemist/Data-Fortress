import { Component, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { DirObj, FileObj, SharedFunctionsService } from '../shared-functions.service';

import { join,basename,sep } from '@tauri-apps/api/path';

@Component({
	selector: 'app-decrypt',
	templateUrl: './decrypt.component.html',
	styleUrls: ['./decrypt.component.scss'],
	providers: [SharedFunctionsService]
})
export class DecryptComponent implements OnInit {

	constructor(public shared_functions: SharedFunctionsService) { }

	ngOnInit(): void {
	}
	decryption_selected_files: FileObj[] = [];
	decryption_selected_folder: string = "";
	FILE_SELECTION_ENABLED: boolean|undefined = undefined;
	decryption_destination_folder: string = this.shared_functions.BASE_DIR + "\\Decrypt";
	decrypt_dir_obj: DirObj[] = [];
	decryption_success: boolean = false;
	decrypt_errors: string[] = [];

	async get_relative_decrypted_file_path(file: FileObj, src_folder: string = "") {
		// console.log("file_name :: ", file_path);
		// console.log("src_folder :: ", src_folder);

		if (src_folder == "") {
			return file.name.split(".encrypted")[0];
		}
		let my_seperator = sep ;

		let selected_folder_name = await basename(src_folder);

		let parts = file.path.split(my_seperator);
		parts = parts.slice(parts.indexOf(selected_folder_name));
		parts[parts.length - 1] = `${parts[parts.length - 1]}.encrypted`;
		
		let relative_path = await join(...parts);

		return relative_path;
	}

	select_decryption_destination_folder() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR)
			.then((result: any) => {
				console.log(result);
				this.decryption_destination_folder = result;
			})
	}
	select_files_to_decrypt() {
		// console.log(this.get_relative_encrypted_file_path("D:\\Somewhere\\Tests\\Rust Encryptions\\try3\\Trial\\Dir_2\\Dir_1\\New Text Document.txt","D:\\Somewhere\\Tests\\Rust Encryptions\\try3\\Trial\\Dir_2"))
		this.shared_functions.open_files_select_dialogue()
			.then((result: any) => {
				console.log(result);
				let all_files: FileObj[] = result.map((file: any) => { return { path: file } });
				console.log(all_files);
				this.shared_functions.set_file_properties_from_file_arr(all_files).then((result: any) => {
					this.decryption_selected_files = result;
				})
				this.FILE_SELECTION_ENABLED = true;
			}
			).catch((err: any) => {
				console.log(err);
			});
	}
	select_folder_to_decrypt() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR + "\\Encrypt").then((result: any) => {
			this.decryption_selected_folder = result;
			this.FILE_SELECTION_ENABLED = false;
			// console.log(this.getAllFiles(this.encryption_selected_folder,[]));
			readDir(this.decryption_selected_folder, { recursive: true, }).then((entries: any) => {
				// console.log(this.get_relative_encrypted_file_path(entries,this.encryption_selected_folder));
				this.decrypt_dir_obj = entries;
				this.shared_functions.set_file_properties_for_dir_obj(entries);
				this.decryption_selected_files = this.shared_functions.get_all_files_from_dir(entries);
			})
		})
	}

	async send_decryption_command(file: FileObj) {
		let relative_path = await this.get_relative_decrypted_file_path(file, this.decryption_selected_folder);
		let my_path = await join(this.decryption_destination_folder, relative_path);
		// console.log("Destination Path :: ", my_path);
		invoke(`plugin:decrypt|decrypt_file`, {
			srcFileName: file.path,
			destFileName: my_path,
			password: this.shared_functions.key,
			chunkSize: 1028 * 32,
		}).then(
			(result: any) => {
				file.decrypted = true;
				console.log(file);
			}
		)
	}
	decrypt_dir(folder: DirObj[]) {
		for (let file of folder) {
			if (file.children != undefined) {
				this.decrypt_dir(file.children);
			}
			else {
				this.send_decryption_command(file);
			}
		}
	}
	async decrypt() {
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
				this.send_decryption_command(file);
			}
			return;
		}
		this.decrypt_dir(this.decrypt_dir_obj);
		// if directory is selected
		// for (let file of this.decryption_selected_files) {
		// 	console.log("Command sent for file :: ", file);
		// 	console.log("Destination :: ", `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file.path, this.decryption_selected_folder)}`);
		// 	invoke(`plugin:decrypt|decrypt_file`, {
		// 		srcFileName: file.path,
		// 		destFileName: `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file.path, this.decryption_selected_folder)}`,
		// 		password: this.shared_functions.key,
		// 		chunkSize: 500,
		// 	}).then(
		// 		(result: any) => {
		// 			completed += 1;
		// 			console.log("Completed :: ", completed);
		// 			if (completed == this.decryption_selected_files.length) {
		// 				this.decryption_success = true;
		// 			}
		// 		}
		// 	)
		// }

	}
}
