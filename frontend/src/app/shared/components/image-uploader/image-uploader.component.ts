import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpEventType } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { LucideLink2, LucideUpload, LucideX } from '@lucide/angular';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from '../../../core/constants/app.constants';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-image-uploader',
  imports: [DragDropModule, LucideLink2, LucideUpload, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="image-inputs">
      <div class="url-input">
        <div class="input-heading">
          <div>
            <b>Image URLs</b>
            <small>Paste one HTTP or HTTPS URL per line.</small>
          </div>
          <svg lucideLink2></svg>
        </div>
        <textarea
          rows="4"
          [value]="urlText()"
          (input)="updateUrlText($event)"
          placeholder="https://example.com/property-front.jpg&#10;https://example.com/property-interior.jpg"
        ></textarea>
        @if (invalidUrls().length) {
          <small class="error">Every image must be a valid HTTP or HTTPS URL.</small>
        }
        <div class="url-actions">
          <small
            >{{ parsedUrls().length }} {{ parsedUrls().length === 1 ? 'URL' : 'URLs' }} ready</small
          >
          <button
            type="button"
            class="btn btn-secondary"
            [disabled]="parsedUrls().length === 0 || invalidUrls().length > 0"
            (click)="addUrls()"
          >
            <svg lucideLink2></svg>Add image URLs
          </button>
        </div>
      </div>

      <div class="device-upload">
        <div>
          <b>Upload from PC</b>
          <small>JPG, PNG, WebP or AVIF · 10 MB maximum per image.</small>
        </div>
        <input
          #picker
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          (change)="choose($event)"
        />
        <button
          type="button"
          class="btn btn-secondary"
          (click)="picker.click()"
          [disabled]="uploading()"
        >
          <svg lucideUpload></svg>{{ uploading() ? 'Uploading…' : 'Choose images' }}
        </button>
      </div>
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
      .image-inputs,
      .url-input {
        display: grid;
        gap: 14px;
      }
      .url-input {
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-subtle);
      }
      .input-heading,
      .url-actions,
      .device-upload {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
      }
      .input-heading > svg {
        width: 21px;
        color: var(--forest);
      }
      .input-heading b,
      .device-upload b,
      .input-heading small,
      .device-upload small {
        display: block;
      }
      .input-heading small,
      .device-upload small,
      .url-actions > small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.72rem;
      }
      .url-input textarea {
        min-height: 104px;
        resize: vertical;
      }
      .device-upload {
        padding: 15px 18px;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-strong);
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
        font-size: 0.75rem;
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
      @media (max-width: 560px) {
        .url-actions,
        .device-upload {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ImageUploaderComponent {
  private api = inject(ApiService);
  private latestImages: string[] | null = null;
  readonly images = input<string[]>([]);
  readonly imagesChange = output<string[]>();
  readonly urlText = signal('');
  readonly progress = signal<number | null>(null);
  readonly error = signal('');
  readonly uploading = signal(false);
  readonly parsedUrls = signal<string[]>([]);
  readonly invalidUrls = signal<string[]>([]);

  updateUrlText(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.urlText.set(value);
    const urls = value
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);
    this.parsedUrls.set(urls);
    this.invalidUrls.set(urls.filter((url) => !this.isValidHttpUrl(url)));
  }

  addUrls() {
    if (!this.parsedUrls().length || this.invalidUrls().length) return;
    this.addImages(this.parsedUrls());
    this.urlText.set('');
    this.parsedUrls.set([]);
    this.invalidUrls.set([]);
  }

  choose(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.upload([...files]);
    (event.target as HTMLInputElement).value = '';
  }
  remove(index: number) {
    this.latestImages = this.currentImages().filter((_, i) => i !== index);
    this.imagesChange.emit(this.latestImages);
  }
  reorder(event: CdkDragDrop<string[]>) {
    const copy = [...this.currentImages()];
    moveItemInArray(copy, event.previousIndex, event.currentIndex);
    this.latestImages = copy;
    this.imagesChange.emit(copy);
  }
  private upload(files: File[]) {
    if (!files.length) return;
    this.error.set('');
    this.uploading.set(true);
    let remaining = files.length;
    for (const file of files) {
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]) ||
        file.size > MAX_UPLOAD_BYTES
      ) {
        this.error.set(`${file.name} is not an accepted image.`);
        remaining--;
        if (remaining === 0) this.uploading.set(false);
        continue;
      }
      this.progress.set(0);
      this.api.upload<{ url: string }>(API_ENDPOINTS.uploads, file).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress)
            this.progress.set(Math.round(100 * (event.loaded / (event.total || event.loaded))));
          if (event.type === HttpEventType.Response) {
            this.addImages([event.body!.url]);
            this.progress.set(null);
            remaining--;
            if (remaining === 0) this.uploading.set(false);
          }
        },
        error: () => {
          this.error.set(`${file.name} could not be uploaded.`);
          this.progress.set(null);
          remaining--;
          if (remaining === 0) this.uploading.set(false);
        },
      });
    }
  }

  private addImages(urls: string[]) {
    this.latestImages = [...new Set([...this.currentImages(), ...urls])];
    this.imagesChange.emit(this.latestImages);
  }

  private currentImages(): string[] {
    return this.latestImages ?? [...this.images()];
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }
}
