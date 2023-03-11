import { Component, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { DirObj, FileObj, SharedFunctionsService } from '../shared-functions.service';

import { join,basename,sep } from '@tauri-apps/api/path';
import { filter } from 'rxjs';

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

	progress_bar_value: number = 0;
	total_files: number = 0;
	completed_files: number = 0;

	refresh_variables() {
		this.decryption_selected_files = [];
		this.decryption_selected_folder = "";
		this.FILE_SELECTION_ENABLED = undefined;
		this.decrypt_dir_obj = [];
		this.decryption_destination_folder = "";
		this.decryption_success = false;
		this.decrypt_errors = [];
		this.progress_bar_value = 0;
		this.total_files = 0;
		this.completed_files = 0;
	}

	async get_relative_decrypted_file_path(file: FileObj, src_folder: string = "") {
		console.log("file_name :: ", file);
		// console.log("src_folder :: ", src_folder);

		if (src_folder == "") {
			return file.name.split(".encrypted")[0];
		}
		let my_seperator = sep ;

		let selected_folder_name = await basename(src_folder);

		let parts = file.path.split(my_seperator);
		parts = parts.slice(parts.indexOf(selected_folder_name));
		parts[parts.length - 1] = parts[parts.length - 1].split(".encrypted")[0];
		
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
		this.shared_functions.open_files_select_dialogue(this.shared_functions.BASE_DIR,['encrypted'])
			.then((result: any) => {
				if (result.length == 0) {
					return;
				}
				// console.log(result);
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
		function filter_entries(entries: DirObj[]) {
			// function that filters out all the files that do not have the .encrypted extension recursively
			let filtered_entries: DirObj[] = [];
			for (let entry of entries) {
				if (entry.children == undefined ) {
					// if the entry is a file
					if (entry.name.split(".").pop() == "encrypted") {
						filtered_entries.push(entry);
					}
				} else {
					let filtered_sub_entries = filter_entries(entry.children);
					if (filtered_sub_entries.length > 0) {
						entry.children = filtered_sub_entries;
						filtered_entries.push(entry);
					}
				}
			}
			return filtered_entries;
		}
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR + "\\Encrypt").then((result: any) => {
			if (result.length == 0) {
				console.log("No folder selected");
				return;
			}
			this.decryption_selected_folder = result;
			this.FILE_SELECTION_ENABLED = false;
			// console.log(this.getAllFiles(this.encryption_selected_folder,[]));
			readDir(this.decryption_selected_folder, { recursive: true, }).then((entries: any) => {
				// console.log(this.get_relative_encrypted_file_path(entries,this.encryption_selected_folder));
				entries = filter_entries(entries);
				console.log("Filtered entries :: ",entries);
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
				this.completed_files += 1;
				this.progress_bar_value = Math.round((this.completed_files / this.total_files) * 100);
			}
		).catch((err: any) => {
			file.decryption_error = true;
			this.decrypt_errors.push("Error decrypting file -> " + file.name);
			this.total_files -= 1;
			this.progress_bar_value = Math.round((this.completed_files / this.total_files) * 100);
			console.log(err);
		})
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
	check_errors(){
		if (this.decryption_selected_files.length == 0) {
			this.decrypt_errors.push("No files selected");
			console.log("No files selected");
			return true;
		}
		if (this.decryption_destination_folder == "") {
			this.decrypt_errors.push("No destination folder selected");
			console.log("No destination folder selected");
			return true;
		}
		return false;
	}
	async decrypt() {
		this.total_files = this.decryption_selected_files.length;
		if (this.check_errors()){
			return;
		}
		if (this.FILE_SELECTION_ENABLED) {
			// if files are selected directly
			for (let file of this.decryption_selected_files) {
				this.send_decryption_command(file);
			}
			return;
		}
		this.decrypt_dir(this.decrypt_dir_obj);
	}
}
