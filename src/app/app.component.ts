import { Component } from '@angular/core';
import { dialog, invoke } from '@tauri-apps/api';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'tauri-encrypter';
  key: string = "asd";
  current_state: string = "";
  BASE_DIR: string = "";
  open_folder_select_dialogue(defaultPath: string=this.BASE_DIR,title: string = "Select a folder", ) {
    return dialog.open({
      title: title,
      defaultPath: defaultPath,
      directory: true,
    })
  }
  open_files_select_dialogue(defaultPath: string = this.BASE_DIR,title: string = "Select files",) {
    return dialog.open({
      title: title,
      defaultPath: defaultPath,
      multiple: true,
    })
    // invoke the tauri api
  }
  //#region Encryption
  encryption_selected_files: string[] = [];
  encryption_destination_folder: string = ""; 
  encryption_success: boolean = false;
  encrypt_errors: string[] =[];
  get_encrypted_file_name(file_path: string) {
    let file_name = file_path.split("\\").slice(-1)[0];
    return `${file_name}.encrypted`;
  }
  
  select_encryption_destination_folder() {
    this.open_folder_select_dialogue().then((result:any) => {
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
  encrypt_all() {
    console.log("Encrypt");
    let completed = 0;
    if (this.encryption_selected_files.length == 0) {
      this.encrypt_errors.push("No files selected");
      console.log("No files selected");
    }else if (this.encryption_destination_folder == "") {
      this.encrypt_errors.push("No destination folder selected");
      console.log("No destination folder selected");
    }else{
      for (let file of this.encryption_selected_files) {
        console.log("Command sent for file :: ", file);
        invoke(`plugin:encrypt|encrypt_file`,{ 
          srcFileName: file,
          destFileName: `${this.encryption_destination_folder}\\${this.get_encrypted_file_name(file)}`,
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
  }

  //#endregion
  //#region Decryption
  decryption_selected_files: string[] = [];
  decryption_destination_folder: string = "";
  decryption_success: boolean = false;
  decrypt_errors: string[] =[];

  get_decrypted_file_name(file_path: string) {
    // add _decrypted to the file name
    let file_name = file_path.split("\\").slice(-1)[0];
    return `${file_name.split(".")[0]}_decrypted.${file_name.split(".")[1]}`;
  }

  select_files_to_decrypt() {
    this.open_files_select_dialogue()
    .then((result:any) => {
      this.decryption_selected_files = result;
      console.log(result);
    }
    ).catch((err:any) => {
      console.log(err);
    });
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
    }else if (this.decryption_destination_folder == "") {
      this.decrypt_errors.push("No destination folder selected");
      console.log("No destination folder selected");
    }else{
      for (let file of this.decryption_selected_files) {
        console.log("Command sent for file :: ", file);
        invoke(`plugin:decrypt|decrypt_file`,{
          srcFileName: file,
          destFileName: `${this.decryption_destination_folder}\\${this.get_decrypted_file_name(file)}`,
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
    }
  }
  //#endregion
}
