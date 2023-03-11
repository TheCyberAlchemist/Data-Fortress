import { Component, OnInit } from '@angular/core';
import {invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { DirObj, FileObj, SharedFunctionsService } from '../shared-functions.service';

import { join,basename,sep } from '@tauri-apps/api/path';


@Component({
	selector: 'app-encrypt',
	templateUrl: './encrypt.component.html',
	styleUrls: ['./encrypt.component.scss'],
	providers: [SharedFunctionsService]
})
export class EncryptComponent implements OnInit {

	constructor(public shared_functions: SharedFunctionsService) { }

	ngOnInit(): void {
	}

	encryption_selected_files: FileObj[] = [];
	encryption_selected_folder: string = "";
	FILE_SELECTION_ENABLED: boolean|undefined = undefined;
	encrypt_dir_obj: DirObj[] = [];

	encryption_destination_folder: string = "";
	encryption_success: boolean = false;
	encrypt_errors: string[] = [];

	progress_bar_value: number = 0;
	total_files: number = 0;
	completed_files: number = 0;

	refresh_variables() {
		this.encryption_selected_files = [];
		this.encryption_selected_folder = "";
		this.FILE_SELECTION_ENABLED = undefined;
		this.encrypt_dir_obj = [];
		this.encryption_destination_folder = this.shared_functions.BASE_DIR + "\\Encrypt";
		this.encryption_success = false;
		this.encrypt_errors = [];
		this.progress_bar_value = 0;
		this.total_files = 0;
		this.completed_files = 0;
	}
	
	async get_relative_encrypted_file_path(file: FileObj, src_folder: string = "") {
		// gets the file obj and the selected folder for encryption
		// returns the relative path of the file from the selected folder
		if (src_folder == "") {
			return `${file.name}.encrypted`;
		}
		let my_seperator = sep ;
		
		let selected_folder_name = await basename(src_folder);

		let parts = file.path.split(my_seperator);
		parts = parts.slice(parts.indexOf(selected_folder_name));
		parts[parts.length - 1] = `${parts[parts.length - 1]}.encrypted`;
		
		let relative_path = await join(...parts);

		return relative_path;
	}
	select_encryption_destination_folder() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR).then((result: any) => {
			this.encryption_destination_folder = result;
		})
	}
	encrypt_in_place() {
		// set the destination folder to the selected folder
		this.encryption_destination_folder = this.encryption_selected_folder;
	}
	select_files_to_encrypt() {
		this.refresh_variables();
		this.shared_functions.open_files_select_dialogue()
			.then((result: any) => {
				if (result.length == 0) {
					return;
				}
				let all_files = result.map((file: any) => {
						return { path: file };
				});
				this.shared_functions.set_file_properties_from_file_arr(all_files).then((result: any) => {
					this.encryption_selected_files = result;
				})
				this.FILE_SELECTION_ENABLED = true;
				console.log(result);
			}
			).catch((err: any) => {
				console.log(err);
			});
	}
	select_folder_to_encrypt() {
		this.refresh_variables();
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR).then((result: any) => {
			if (result.length == 0) {
				return;
			}
			this.encryption_selected_folder = result;
			this.FILE_SELECTION_ENABLED = false;
			// console.log(this.getAllFiles(this.encryption_selected_folder,[]));

			readDir(this.encryption_selected_folder, { recursive: true, }).then((result: any) => {
				this.encrypt_dir_obj = result;
				// console.log("dir::",basename(this.encryption_selected_folder));
				this.shared_functions.set_file_properties_for_dir_obj(this.encrypt_dir_obj);
				this.encryption_selected_files = this.shared_functions.get_all_files_from_dir(result);
			})
		})
	}
	async send_encryption_command(file: FileObj) {
		let relative_path = await this.get_relative_encrypted_file_path(file, this.encryption_selected_folder);
		let my_path = await join(this.encryption_destination_folder, relative_path);
		console.log("Destination Path :: ", my_path);
		invoke(`plugin:encrypt|encrypt_file`, {
			srcFileName: file.path,
			destFileName: my_path,
			password: this.shared_functions.key,
			chunkSize: 1028 * 32,
		}).then(
			(result: any) => {
				file.encrypted = true;
				this.completed_files += 1;
				this.progress_bar_value = Math.round((this.completed_files / this.total_files) * 100);
			}
		).catch((err: any) => {
			file.encryption_error = true;
			this.encrypt_errors.push("Error encrypting file -> " + file.name);
			this.total_files -= 1;
			this.progress_bar_value = Math.round((this.completed_files / this.total_files) * 100);
			console.log(err);
		})
	}
	encrypt_dir(folder: DirObj[]) {
		for (let file of folder) {
			if (file.children != undefined) {
				this.encrypt_dir(file.children);
			}
			else {
				// console.log("Command sent for file :: ", file);
				// console.log("Destination :: ",);
				this.send_encryption_command(file);
			}
		}
	}
	check_errors() {
		if (this.encryption_selected_files.length == 0) {
			this.encrypt_errors.push("No files selected");
			console.log("No files selected");
			return true;
		}
		if (this.encryption_destination_folder == "") {
			this.encrypt_errors.push("No destination folder selected");
			console.log("No destination folder selected");
			return true;
		}
		return false;
	}
	async encrypt() {
		this.total_files = this.encryption_selected_files.length;
		if (this.check_errors()) {
			return;
		}
		if (this.FILE_SELECTION_ENABLED) {
			// if files are selected directly
			for (let file of this.encryption_selected_files) {
				// console.log("Command sent for file :: ", file);
				// console.log("Destination :: ", `${my_path}`);
				this.send_encryption_command(file);
			}
			return;
		}
		this.encrypt_dir(this.encrypt_dir_obj);
	}
}
