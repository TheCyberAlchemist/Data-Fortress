import { Component } from '@angular/core';
import { dialog, invoke } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';


interface DirObj {
  path: string;
  children: DirObj[];
  name: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'tauri-encrypter';
  key: string = "asd";
  current_state: string = "";
  BASE_DIR: string = "D:\\Somewhere\\Tests\\Rust Encryptions\\try3";
  
  open_folder_select_dialogue(defaultPath: string=this.BASE_DIR,title: string = "Select a folder" ) {
    return dialog.open({
      title: title,
      defaultPath: defaultPath,
      directory: true,
    })
  }
  open_files_select_dialogue(defaultPath: string = this.BASE_DIR,title: string = "Select files") {
    return dialog.open({
      title: title,
      defaultPath: defaultPath,
      multiple: true,
    })
    // invoke the tauri api
  }
  
  //#region Encryption
  encryption_selected_files: string[] = [];
  encryption_selected_folder: string = "";
  encrypt_dir_obj: DirObj[] = [];
  encryption_destination_folder: string = this.BASE_DIR + "\\Encrypt"; 
  encryption_success: boolean = false;
  encrypt_errors: string[] =[];
  get_all_file_paths(dir_obj: DirObj[]) {
    let all_files: string[] = [];
    for (let file of dir_obj) {
      if (file.children) {
        all_files.push(...this.get_all_file_paths(file.children));
      } else {
        all_files.push(file.path);
      }
    }
    // for (let file of all_files) {
    //   console.log(this.get_relative_encrypted_file_path(file,this.encryption_selected_folder));
    // }
    return all_files;
  }
  get_relative_encrypted_file_path(file_name: string,src_folder: string="") {
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
    let relative_path = file_name.replace(src_folder,"");
    // change the slashes to backslashes
    relative_path = relative_path.replace(/\//g,"\\");
    relative_path = relative_path.substring(1);
    let selected_folder_name = src_folder.split("\\").pop();
    relative_path = `${selected_folder_name}\\${relative_path}.encrypted`;
    return relative_path;
  }
  select_encryption_destination_folder() {
    this.open_folder_select_dialogue(this.BASE_DIR).then((result:any) => {
      this.encryption_destination_folder = result;
    })
  }
  select_files_to_encrypt() {
    this.open_files_select_dialogue()
    .then((result:any) => {
      this.encryption_selected_files = result;
      console.log(result);
    }
    ).catch((err:any) => {
      console.log(err);
    });
  }
  select_folder_to_encrypt() {
    this.open_folder_select_dialogue(this.BASE_DIR).then((result:any) => {
      this.encryption_selected_folder = result;
      // console.log(this.getAllFiles(this.encryption_selected_folder,[]));
      readDir(this.encryption_selected_folder ,{ recursive: true , }).then((entries:any) => {
        // console.log(this.get_relative_encrypted_file_path(entries,this.encryption_selected_folder));
        this.encrypt_dir_obj = entries;
        console.log(entries);
        this.encryption_selected_files = this.get_all_file_paths(entries);

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
        console.log("Destination :: ", `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file)}`);
        invoke(`plugin:encrypt|encrypt_file`,{ 
          srcFileName: file,
          destFileName: `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file, this.encryption_selected_folder)}`,
          password: this.key,
          chunkSize: 500,
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
      return;
    }
    // if directory is selected
    for (let file of this.encryption_selected_files) {
      console.log("Command sent for file :: ", file);
      console.log("Destination :: ", `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file, this.encryption_selected_folder)}`);
      invoke(`plugin:encrypt|encrypt_file`,{ 
        srcFileName: file,
        destFileName: `${this.encryption_destination_folder}\\${this.get_relative_encrypted_file_path(file, this.encryption_selected_folder)}`,
        password: this.key,
        chunkSize: 500,
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

  //#endregion
  //#region Decryption
  decryption_selected_files: string[] = [];
  decryption_selected_folder: string = "";
  decryption_destination_folder: string = this.BASE_DIR+"\\Decrypt";
  decrypt_dir_obj: DirObj[] = [];
  decryption_success: boolean = false;
  decrypt_errors: string[] =[];

  get_relative_decrypted_file_path(file_path:string,src_folder:string=""):string {
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
    
    let relative_path = file_path.replace(src_folder,"");
    // change the slashes to backslashes "path/asdf" -> "path\\asdf
    relative_path = relative_path.replace(/\//g,"\\");
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
    this.open_files_select_dialogue()
    .then((result:any) => {
      this.decryption_selected_files = result;
      console.log(result);
    }
    ).catch((err:any) => {
      console.log(err);
    });
  }
  select_folder_to_decrypt() {
    this.open_folder_select_dialogue(this.BASE_DIR+"\\Encrypt").then((result:any) => {
      this.decryption_selected_folder = result;
      // console.log(this.getAllFiles(this.encryption_selected_folder,[]));
      readDir(this.decryption_selected_folder ,{ recursive: true , }).then((entries:any) => {
        // console.log(this.get_relative_encrypted_file_path(entries,this.encryption_selected_folder));
        this.decrypt_dir_obj = entries;
        console.log(entries);
        this.decryption_selected_files = this.get_all_file_paths(entries);
      })
    })
  }
  select_decryption_destination_folder() {
    this.open_folder_select_dialogue(this.BASE_DIR)
    .then((result:any) => {
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
        invoke(`plugin:decrypt|decrypt_file`,{
          srcFileName: file,
          destFileName: `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file, this.decryption_selected_folder)}`,
          password: this.key,
          chunkSize: 500,
         }).then(
          (result: any) => {
            completed += 1;
            console.log("Completed :: ", result);
            if (completed == this.decryption_selected_files.length) {
              this.decryption_success = true;
            }
          }
        ).catch((err:any) => {
          this.decrypt_errors.push(err);
          console.log("Error in Decryption :: ",err);
        })
      }
      return;
    }
    // if directory is selected
    for (let file of this.decryption_selected_files) {
      console.log("Command sent for file :: ", file);
      console.log("Destination :: ", `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file, this.decryption_selected_folder)}`);
      invoke(`plugin:decrypt|decrypt_file`,{ 
        srcFileName: file,
        destFileName: `${this.decryption_destination_folder}\\${this.get_relative_decrypted_file_path(file, this.decryption_selected_folder)}`,
        password: this.key,
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

  //#endregion
}
