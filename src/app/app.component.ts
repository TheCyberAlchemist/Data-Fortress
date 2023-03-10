import { Component } from '@angular/core';
import { dialog, invoke,fs } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { SharedFunctionsService } from './shared-functions.service';
// import stat 


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

}
