import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FileFolderComponent } from './file-folder/file-folder.component';
import { TopbarComponent } from './topbar/topbar.component';
import { EncryptComponent } from './encrypt/encrypt.component';
import { DecryptComponent } from './decrypt/decrypt.component';
import { SharedFunctionsService } from './shared-functions.service';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    FileFolderComponent,
    TopbarComponent,
    EncryptComponent,
    DecryptComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
