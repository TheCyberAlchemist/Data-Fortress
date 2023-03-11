import { Injectable } from '@angular/core';
import { dialog, invoke} from '@tauri-apps/api';

export interface DirObj {
	path: string;
	name: string;
	children: DirObj[];
	size_in_kb?: number;
}

export interface FileObj {
	path: string;
	name: string;
	size_in_kb?: number;
	extension?: string;
	encrypted?: boolean;
	decrypted?: boolean;
}
@Injectable()
export class SharedFunctionsService {
	title = 'tauri-encrypter';
	key: string = "asd";
	current_state: string = "";
	BASE_DIR: string = "D:\\Somewhere\\Tests\\Rust Encryptions\\try3";

	change_key(e: any) {
		this.key = e.target.value;
	}
	open_folder_select_dialogue(defaultPath: string = this.BASE_DIR, title: string = "Select a folder") {
		return dialog.open({
			title: title,
			defaultPath: defaultPath,
			directory: true,
		})
	}
	open_files_select_dialogue(defaultPath: string = this.BASE_DIR, title: string = "Select files") {
		return dialog.open({
			title: title,
			defaultPath: defaultPath,
			multiple: true,
		})
		// invoke the tauri api
	}
	set_file_properties_from_file_arr(files: FileObj[]) {
		// setting the properties of the file like name, extension, size
		for (let file of files) {
			this.get_size_in_kb(file).then((size) => {
				file.size_in_kb = size;
				file.name = file.path.replace(/^.*[\\\/]/, '')
				let ext = file.path.split(".").reverse()

				file.extension = ext[0] != 'encrypted' ? ext[0] : ext[1]
			});
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
		console.log(all_files);
		return all_files;
	}
	set_file_size_in_dir(dir_obj: DirObj[]) {
		for (let file of dir_obj) {
			if (file.children) {
				this.set_file_size_in_dir(file.children);
			} else {
				this.get_size_in_kb(file).then((size) => {
					file.size_in_kb = size;
				});
			}
		}
	}
	get_size_in_kb(file: FileObj): Promise<number> {
		return invoke(`plugin:functions|get_file_size`, {
			fileName: file.path,
		}).then((size: any) => {
			console.log(file.path, size);
			let size_in_kb = size / 1024;
			size_in_kb = Math.round(size_in_kb * 100) / 100;
			return size_in_kb;
		});
	}
}
