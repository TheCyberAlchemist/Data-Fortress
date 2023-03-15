import { Component, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { DirObj, ErrorObj, FileObj, SharedFunctionsService } from '../shared-functions.service';

import { join, sep } from '@tauri-apps/api/path';

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
	FILE_SELECTION_ENABLED: boolean | undefined = undefined;
	decryption_destination_folder: string = "";
	decrypt_dir_obj: DirObj[] = [];
	decryption_success: boolean = false;
	decrypt_errors: ErrorObj[] = [];
	other_errors: ErrorObj[] = [];

	progress_bar_value: number = 0;
	total_files: number = 0;
	completed_files: number = 0;

	decrypt_in_place: boolean = false;

	decryption_started: boolean = false;

	refresh_variables() {
		this.decryption_selected_files = [];
		this.decryption_selected_folder = "";
		this.FILE_SELECTION_ENABLED = undefined;
		this.decrypt_dir_obj = [];
		this.decryption_destination_folder = "";
		this.decryption_success = false;
		this.decrypt_errors = [];
		this.other_errors = [];
		this.progress_bar_value = 0;
		this.total_files = 0;
		this.completed_files = 0;
		this.decrypt_in_place = false;
		this.decryption_started = false;
	}
	async set_decrypt_in_place() {
		// set the destination folder to the selected folder
		// function removes the last element of the array
		// in case of folder select name eg. "path_to_folder/Encrypt" -> "path_to_folder"
		// in case of file select name eg. "path_to_folder/Encrypt/file.txt" -> "path_to_folder/Encrypt"
		this.decrypt_in_place = true;
		if (this.FILE_SELECTION_ENABLED == undefined) {
			this.other_errors.push({ type: "file_selection_error", description: "Please select a folder or files to decrypt" });
			return;
		}
		let my_path_arr: string[] = [];
		if (this.FILE_SELECTION_ENABLED) {
			my_path_arr = this.decryption_selected_files[0].path.split(sep);
		} else {
			my_path_arr = this.decryption_selected_folder.split(sep);
		}

		my_path_arr.pop();
		this.decryption_destination_folder = my_path_arr.join(sep);
	}
	async get_relative_decrypted_file_path(file: FileObj, src_folder: string = "") {
		console.log("file_name :: ", file);
		// console.log("src_folder :: ", src_folder);

		if (src_folder == "") {
			return file.name.split(".dfort")[0];
		}
		let my_seperator = sep;

		let selected_folder_name = this.get_selected_folder_name(src_folder);
		let parts = file.path.split(my_seperator);
		parts = parts.slice(parts.indexOf(selected_folder_name));
		parts[parts.length - 1] = parts[parts.length - 1].split(".dfort")[0];

		let relative_path = await join(...parts);

		return relative_path;
	}
	select_decryption_destination_folder() {
		this.shared_functions.open_folder_select_dialogue(this.shared_functions.BASE_DIR).then((result: any) => {
			this.decrypt_in_place = false;
			if( (result||[]).length<=0) {
				// no folder selected
				return;
			}
			this.decryption_destination_folder = result;
			this.other_errors = this.other_errors.filter((err) => {err.type=="destination_path_error"})
		})
	}
	select_files_to_decrypt() {
		this.refresh_variables();
		this.shared_functions.open_files_select_dialogue(this.shared_functions.BASE_DIR, ["dfort"])
			.then((result: any) => {
				if ((result||[]).length == 0) {
					return;
				}
				result = result.filter((file: string) => {
					return file.split(".").pop() == "dfort";
				});
				if (result.length == 0) {
					this.other_errors.push({ type: "file_type_error", description: "Please select files with the .dfort extension" });
					return;
				}
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
	get_selected_folder_name(abs_path:string) {
		let my_seperator = sep;
		let parts = abs_path.split(my_seperator);
		let selected_folder_name = parts.pop();
		if (selected_folder_name == undefined) {
			selected_folder_name = "";
		} else if (selected_folder_name == "") {
			// return the second last element
			selected_folder_name = parts[parts.length - 1];
		}
		return selected_folder_name;
	}
	select_folder_to_decrypt() {
		this.refresh_variables();
		function filter_entries(entries: DirObj[]) {
			// function that filters out all the files that do not have the .dfort extension recursively
			let filtered_entries: DirObj[] = [];
			for (let entry of entries) {
				if (entry.children == undefined) {
					// if the entry is a file
					if (entry.name.split(".").pop() == "dfort") {
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
		this.shared_functions.open_folder_select_dialogue().then((result: any) => {
			if ((result||[]).length == 0) {
				console.log("No folder selected");
				return;
			}
			console.log("Selected Folder :: ", this.get_selected_folder_name(result));
			// console.log(this.getAllFiles(this.encryption_selected_folder,[]));
			readDir(result, { recursive: true, }).then((entries: any) => {
				// console.log(this.get_relative_encrypted_file_path(entries,this.encryption_selected_folder));
				console.log("Entries :: ", entries);
				entries = filter_entries(entries);
				console.log("Filtered Entries :: ", entries);
				if (entries.length == 0) {
					console.log("No files with the .dfort extension found in the selected folder");
					this.other_errors.push({ type: "file_type_error", description: "Please select a folder that contains files with the .dfort extension" });
					return;
				}
				this.decryption_selected_folder = result;
				this.FILE_SELECTION_ENABLED = false;
				console.log("Filtered entries :: ", entries);
				this.decrypt_dir_obj = entries;
				this.shared_functions.set_file_properties_for_dir_obj(entries);
				this.decryption_selected_files = this.shared_functions.get_all_files_from_dir(entries);
			})
		})
	}
	all_decryption_success() {
		// function to be called when all the files have been decrypted
		this.decryption_success = true;
		this.other_errors = [];
		this.decrypt_errors = [];
	}
	async send_decryption_command(file: FileObj) {
		let relative_path = await this.get_relative_decrypted_file_path(file, this.decryption_selected_folder);
		let my_path = await join(this.decryption_destination_folder, relative_path);
		// console.log("Destination Path :: ", my_path);
		invoke(`plugin:decrypt|decrypt_file`, {
			srcFileName: file.path,
			destFileName: my_path,
			password: this.shared_functions.key,
			decryptInPlace: this.decrypt_in_place,
		}).then(
			(result: any) => {
				file.decrypted = true;
				this.completed_files += 1;
				this.progress_bar_value = Math.round((this.completed_files / this.total_files) * 100);
				if (this.completed_files == this.total_files && this.decrypt_errors.length == 0) {
					this.all_decryption_success();
				}
			}
		).catch((err: any) => {
			file.decryption_error = true;
			// this.decrypt_errors.push("⚠️ Error decrypting file: " + file.name);
			this.decrypt_errors.push({
				file_name: file.name, type: "decryption_error", description: "Error decrypting file:"
			}
			);
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
	check_errors() {
		if (this.decryption_selected_files.length == 0) {
			this.other_errors.push({ type: "selection_error", description: "No files selected" });
			console.log("No files selected");
			return true;
		}
		if (this.decryption_destination_folder == "") {
			this.other_errors.push({ type: "destination_path_error", description: "No destination folder selected" });
			console.log("No destination folder selected");
			return true;
		}
		if (this.shared_functions.key == "") {
			this.other_errors.push({type: "key_error",description: "No key entered"});
			return true;
		}
		return false;
	}
	async decrypt() {
		if (this.check_errors()) {
			return;
		}
		this.decryption_started = true;
		this.total_files = this.decryption_selected_files.length;
		if (this.FILE_SELECTION_ENABLED) {
			// if files are selected directly
			for (let file of this.decryption_selected_files) {
				this.send_decryption_command(file);
			}
			return;
		}
		this.decrypt_dir(this.decrypt_dir_obj);
	}

	handleChange(evt:any) {

		var target = evt.target;
		console.log(target.value);
		if (target.checked) {
			if(target.value == "decrypt_in_place") {
				this.set_decrypt_in_place()
			}
			else if(target.value == "decrypt_in_destination") {
				this.select_decryption_destination_folder()
			}
		}
	}
}
