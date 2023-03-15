import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DecryptComponent } from './decrypt/decrypt.component';
import { EncryptComponent } from './encrypt/encrypt.component';

const routes: Routes = [
  { path: '', redirectTo: '/encrypt', pathMatch: 'full' },
  { path: 'encrypt', component: EncryptComponent,},
  { path: 'decrypt', component: DecryptComponent, },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
