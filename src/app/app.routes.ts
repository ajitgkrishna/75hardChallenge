import { Routes } from '@angular/router';
import { TrackerComponent } from './tracker/tracker.component';
import { GalleryComponent } from './gallery/gallery.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: TrackerComponent, canActivate: [authGuard] },
    { path: 'gallery', component: GalleryComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
