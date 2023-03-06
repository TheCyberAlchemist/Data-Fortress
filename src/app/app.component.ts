import { Component } from '@angular/core';
import { dialog } from '@tauri-apps/api';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'tauri-encrypter';
  open_dialogue() {
    console.log("Open dialogue");
  
    dialog.open({
      title: 'Select a folder',
      defaultPath: 'C:\\',
      directory: true,
    }).then((result:any) => {
      console.log(result);
    }
    ).catch((err:any) => {
      console.log(err);
    });

  }
}
