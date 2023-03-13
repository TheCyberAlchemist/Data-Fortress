import { Injectable } from '@angular/core';
import { dialog, invoke} from '@tauri-apps/api';

import { basename } from '@tauri-apps/api/path';
export interface DirObj {
	path: string;
	name: string;
	children: DirObj[];
	size_in_kb?: number;
	extension?: string;
	encrypted?: boolean;
	encryption_error?: boolean;
	decrypted?: boolean;
	decryption_error?: boolean;
}

export interface ErrorObj {
	type: string;
	file_name?: string;
	description?: string;	
}

export interface FileObj {
	path: string;
	name: string;
	size_in_kb?: number;
	extension?: string;
	encrypted?: boolean;
	encryption_error?: boolean;
	decrypted?: boolean;
	decryption_error?: boolean;
}
@Injectable()
export class SharedFunctionsService {
	title = 'data-fortress';
	key: string = "asd";
	current_state: string = "";
	// BASE_DIR: string = "D:\\Somewhere\\Tests\\Rust Encryptions\\try3";
	BASE_DIR: string = "";
	
	change_key(e: any) {
		this.key = e.target.value;
	}
	open_folder_select_dialogue(defaultPath: string = this.BASE_DIR, title: string = "Select a folder") {
		return dialog.open({
			title: title,
			// defaultPath: defaultPath,
			directory: true,
		})
	}
	open_files_select_dialogue(defaultPath: string = this.BASE_DIR,extensions: string[] = ["*"], title: string = "Select files") {
		return dialog.open({
			title: title,
			// defaultPath: defaultPath,
			multiple: true,
			filters: [{ 
				name: "All Files", 
				extensions: extensions 
			}],
		})
		// invoke the tauri api
	}
	async set_file_properties_from_file_arr(files: FileObj[]) {
		// setting the properties of the file like name, extension, size
		for (let file of files) {
			file.size_in_kb = await this.get_size_in_kb(file);
			file.name = await basename(file.path);
			let ext = file.path.split(".").reverse()
			file.extension = ext[0] != 'encrypted' ? ext[0] : ext[1]
		}
		return files;
	}
	get_all_files_from_dir(dir_obj: DirObj[]): FileObj[] {
		let all_files: FileObj[] = [];
		for (let file of dir_obj) {
			if (file.children) {
				all_files.push(...this.get_all_files_from_dir(file.children));
			} else {
				all_files.push({ path: file.path, name: file.name });
			}
		}
		return all_files;
	}
	async set_file_properties_for_dir_obj(dir_obj: DirObj[]) {
		for (let file of dir_obj) {
			if (file.children) {
				this.set_file_properties_for_dir_obj(file.children);
			} else {
				file.size_in_kb = await this.get_size_in_kb(file);
				file.name = await basename(file.path);
				let ext = file.path.split(".").reverse()
				file.extension = ext[0] != 'encrypted' ? ext[0] : ext[1]
			}
		}
	}
	get_size_in_kb(file: FileObj): Promise<number> {
		return invoke(`plugin:functions|get_file_size`, {
			fileName: file.path,
		}).then((size: any) => {
			let size_in_kb = size / 1024;
			size_in_kb = Math.round(size_in_kb * 100) / 100;
			return size_in_kb;
		});
	}
}
