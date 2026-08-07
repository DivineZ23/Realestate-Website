import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { LucideUpload, LucideX } from '@lucide/angular';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '../../../core/constants/app.constants';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-image-uploader',
  imports: [DragDropModule, LucideUpload, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="drop" (dragover)="$event.preventDefault()" (drop)="dropFiles($event)">
      <input
        #picker
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        (change)="choose($event)"
      /><button type="button" class="btn btn-secondary" (click)="picker.click()">
        <svg lucideUpload></svg>Choose images
      </button>
      <p>or drag and drop · JPG, PNG, WebP or AVIF · 10 MB max</p>
      @if (progress() !== null) {
        <div class="progress"><span [style.width.%]="progress()"></span></div>
      }
      @if (error()) {
        <small class="error">{{ error() }}</small>
      }
    </div>
    <div
      class="previews"
      cdkDropList
      cdkDropListOrientation="mixed"
      (cdkDropListDropped)="reorder($event)"
    >
      @for (image of images(); track image; let i = $index) {
        <div class="preview" cdkDrag>
          <img [src]="image" alt="Property preview" /><button
            type="button"
            (click)="remove(i)"
            aria-label="Remove image"
          >
            <svg lucideX></svg>
          </button>
          @if (i === 0) {
            <span>Featured</span>
          }
        </div>
      }
    </div>`,
  styles: [
    `
      .drop {
        padding: 28px;
        border: 1px dashed var(--drop-border);
        border-radius: var(--radius-md);
        text-align: center;
        background: var(--surface-subtle);
      }
      .drop p {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 0.8rem;
      }
      .progress {
        height: 5px;
        margin-top: 14px;
        border-radius: 5px;
        background: var(--border);
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        background: var(--forest);
      }
      .error {
        display: block;
        color: var(--danger);
        margin-top: 8px;
      }
      .previews {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .preview {
        position: relative;
        aspect-ratio: 1.2;
        border-radius: 10px;
        overflow: hidden;
        cursor: grab;
      }
      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .preview button {
        position: absolute;
        right: 5px;
        top: 5px;
        border: 0;
        border-radius: 50%;
        background: var(--surface-strong);
        color: var(--ink);
        width: 25px;
        height: 25px;
        cursor: pointer;
        display: grid;
        place-items: center;
        padding: 0;
      }
      .preview button svg {
        width: 14px;
        height: 14px;
      }
      .preview span {
        position: absolute;
        left: 6px;
        bottom: 6px;
        background: var(--forest);
        color: var(--on-primary);
        padding: 3px 7px;
        border-radius: 99px;
        font-size: 0.65rem;
      }
    `,
  ],
})
export class ImageUploaderComponent {
  private api = inject(ApiService);
  readonly images = input<string[]>([]);
  readonly imagesChange = output<string[]>();
  readonly progress = signal<number | null>(null);
  readonly error = signal('');
  choose(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.upload([...files]);
  }
  dropFiles(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) this.upload([...event.dataTransfer.files]);
  }
  remove(index: number) {
    this.imagesChange.emit(this.images().filter((_, i) => i !== index));
  }
  reorder(event: CdkDragDrop<string[]>) {
    const copy = [...this.images()];
    moveItemInArray(copy, event.previousIndex, event.currentIndex);
    this.imagesChange.emit(copy);
  }
  private upload(files: File[]) {
    for (const file of files) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
        file.size > MAX_UPLOAD_BYTES
      ) {
        this.error.set(`${file.name} is not an accepted image.`);
        continue;
      }
      this.progress.set(0);
      this.api.upload<{ url: string }>(API_ENDPOINTS.uploads, file).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress)
            this.progress.set(Math.round(100 * (event.loaded / (event.total || event.loaded))));
          if (event.type === HttpEventType.Response) {
            this.imagesChange.emit([...this.images(), event.body!.url]);
            this.progress.set(null);
          }
        },
        error: () => this.progress.set(null),
      });
    }
  }
}
