import { Component } from '@angular/core';
import { dialog, invoke,fs } from '@tauri-apps/api';
import { readDir } from '@tauri-apps/api/fs';
import { SharedFunctionsService } from './shared-functions.service';
// import stat 


interface DirObj {
  path: string;
  name: string;
  children: DirObj[];
  size_in_kb?: number;
}

interface FileObj {
  path: string;
  name: string;
  size_in_kb?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

}
