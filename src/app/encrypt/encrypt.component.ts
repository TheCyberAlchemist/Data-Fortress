import { Component, OnInit } from '@angular/core';
import {invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { DirObj, FileObj, SharedFunctionsService } from '../shared-functions.service';

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
	encryption_destination_folder: string = "C:\\Users\\yogesh\\Desktop\\encrypted";
	encryption_success: boolean = false;
	encrypt_errors: string[] = [];

	get_relative_encrypted_file_path(file_name: string, src_folder: string = "") {
		// remove the src_folder's ancesters from the file_name
		// eg. src_folder = D:\Somewhere\src
		// file_name = D:\Somewhere\src\folder1\folder2\file.txt
		// relative_path = src\folder1\folder2\file.txt.encrypted
		// keep the src_folder's name in the relative path
		// console.log("file_name :: ", file_name);
		// console.log("src_folder :: ", src_folder);

		if (src_folder == "") {
			// if file is selected directly

			// remove all folder ref from the file_name
			let relative_path = file_name.split("\\").pop();

			return `${relative_path}.encrypted`;
		}
		let relative_path = file_name.replace(src_folder, "");
		// change the slashes to backslashes
		relative_path = relative_path.replace(/\//g, "\\");
		relative_path = relative_path.substring(1);
		let selected_folder_name = src_folder.split("\\").pop();
		relative_path = `${selected_folder_name}\\${relative_path}.encrypted`;
		return relative_path;
	}
	select_encryption_destination_folder() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR).then((result: any) => {
			this.encryption_destination_folder = result;
		})
	}
	select_files_to_encrypt() {
		this.shared_functions.open_files_select_dialogue()
			.then((result: any) => {
				let all_files = result.map((file: any) => {
					return { path: file };
				});
				this.encryption_selected_files = this.shared_functions.set_file_properties_from_file_arr(all_files);
				this.FILE_SELECTION_ENABLED = true;
				console.log(result);
			}
			).catch((err: any) => {
				console.log(err);
			});
	}
	select_folder_to_encrypt() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR).then((result: any) => {
			this.encryption_selected_folder = result;
			this.FILE_SELECTION_ENABLED = false;
			// console.log(this.getAllFiles(this.encryption_selected_folder,[]));

			readDir(this.encryption_selected_folder, { recursive: true, }).then((result: any) => {
				this.encrypt_dir_obj = result;
				this.shared_functions.set_file_size_in_dir(this.encrypt_dir_obj);
				// console.log(result);
				this.encryption_selected_files = this.shared_functions.get_all_files_from_dir(result);
			})
		})
	}
	encrypt_all() {
		let completed = 0;
		if (this.encryption_selected_files.length == 0) {
			this.encrypt_errors.push("No files selected");
			console.log("No files selected");
			return;
		}
		if (this.encryption_destination_folder == "") {
			this.encrypt_errors.push("No destination folder selected");
			console.log("No destination folder selected");
			return;
		}
		if (this.encrypt_dir_obj.length == 0) {
			// if files are selected directly
			for (let file of this.encryption_selected_files) {
				console.log("Command sent for file :: ", file);
				console.log("Destination :: ", `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file.path)}`);
				invoke(`plugin:encrypt|encrypt_file`, {
					srcFileName: file.path,
					destFileName: `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file.path, this.encryption_selected_folder)}`,
					password: this.shared_functions.key,
					chunkSize: 1028 * 32,
				}).then(
					(result: any) => {
						file.encrypted = true;
						completed += 1;
						console.log("Completed :: ", completed);
						if (completed == this.encryption_selected_files.length) {
							this.encryption_success = true;
						}
					}
				)
			}
			return;
		}
		// if directory is selected
		for (let file of this.encryption_selected_files) {
			console.log("Command sent for file :: ", file);
			console.log("Destination :: ", `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file.path, this.encryption_selected_folder)}`);
			invoke(`plugin:encrypt|encrypt_file`, {
				srcFileName: file,
				destFileName: `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file.path, this.encryption_selected_folder)}`,
				password: this.shared_functions.key,
				chunkSize: 1028 * 32,
			}).then(
				(result: any) => {
					completed += 1;
					console.log("Completed :: ", completed);
					if (completed == this.encryption_selected_files.length) {
						this.encryption_success = true;
					}
				}
			)
		}
	}
}
