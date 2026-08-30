import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LucideLink2, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-image-uploader',
  imports: [DragDropModule, LucideLink2, LucideX],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="image-inputs">
      <div class="input-heading">
        <div>
          <b>Property image</b>
          <small>Paste one or more image URLs, with each URL on a separate line.</small>
        </div>
        <svg lucideLink2></svg>
      </div>
      <div class="image-entry">
        <textarea
          [value]="urlText()"
          (input)="updateUrlText($event)"
          placeholder="https://example.com/front-view.jpg&#10;https://example.com/interior.jpg"
          rows="3"
        ></textarea>
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="!urlText().trim() || urlInvalid()"
          (click)="addUrls()"
        >
          <svg lucideLink2></svg>Add images
        </button>
      </div>
      @if (urlInvalid()) {
        <small class="error">Every entry must be a valid HTTP or HTTPS image URL.</small>
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
      .image-inputs {
        display: grid;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--surface-subtle);
      }
      .input-heading,
      .image-entry {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .input-heading > svg {
        width: 21px;
        color: var(--forest);
      }
      .input-heading b,
      .input-heading small {
        display: block;
      }
      .input-heading small {
        margin-top: 4px;
        color: var(--muted);
        font-size: 0.72rem;
      }
      .image-entry > textarea {
        min-width: 0;
        flex: 1;
        resize: vertical;
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
        .image-entry {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ImageUploaderComponent {
  private latestImages: string[] | null = null;
  readonly images = input<string[]>([]);
  readonly imagesChange = output<string[]>();
  readonly urlText = signal('');
  readonly urlInvalid = signal(false);

  updateUrlText(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.urlText.set(value);
    const urls = this.parseUrls(value);
    this.urlInvalid.set(urls.length > 0 && urls.some((url) => !this.isValidHttpUrl(url)));
  }

  addUrls() {
    const urls = this.parseUrls(this.urlText());
    if (!urls.length || urls.some((url) => !this.isValidHttpUrl(url))) {
      this.urlInvalid.set(Boolean(this.urlText().trim()));
      return;
    }
    this.addImages(urls);
    this.urlText.set('');
    this.urlInvalid.set(false);
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
  private addImages(urls: string[]) {
    this.latestImages = [...new Set([...this.currentImages(), ...urls])];
    this.imagesChange.emit(this.latestImages);
  }

  private currentImages(): string[] {
    return this.latestImages ?? [...this.images()];
  }

  private parseUrls(value: string): string[] {
    return value
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }
}
