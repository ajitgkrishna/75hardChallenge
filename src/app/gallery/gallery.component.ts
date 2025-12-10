import { Component, OnInit, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../services/progress.service';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  private progressService = inject(ProgressService);
  private cdr = inject(ChangeDetectorRef);

  images$!: Observable<{ day: number, url: string, date: Date }[]>;
  currentImages: { day: number, url: string, date: Date }[] = [];

  selectedImage: string | null = null;
  currentIndex: number = -1;

  ngOnInit() {
    this.images$ = this.progressService.getGalleryImages().pipe(
      tap(images => this.currentImages = images)
    );
  }

  openImage(url: string) {
    console.log('Opening image:', url);
    this.selectedImage = url;
    this.currentIndex = this.currentImages.findIndex(img => img.url === url);
    this.cdr.detectChanges();
  }

  closeImage() {
    this.selectedImage = null;
    this.currentIndex = -1;
    this.cdr.detectChanges();
  }

  nextImage(event?: Event) {
    if (event) event.stopPropagation();
    if (this.hasNext()) {
      this.currentIndex++;
      this.selectedImage = this.currentImages[this.currentIndex].url;
      this.cdr.detectChanges();
    }
  }

  prevImage(event?: Event) {
    if (event) event.stopPropagation();
    if (this.hasPrev()) {
      this.currentIndex--;
      this.selectedImage = this.currentImages[this.currentIndex].url;
      this.cdr.detectChanges();
    }
  }

  hasNext(): boolean {
    return this.currentIndex < this.currentImages.length - 1;
  }

  hasPrev(): boolean {
    return this.currentIndex > 0;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: any) {
    if (!this.selectedImage) return;

    if (event.key === 'Escape') {
      this.closeImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }
}
