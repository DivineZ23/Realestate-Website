import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Property } from '../../core/models/property.models';

@Component({
  selector: 'app-evict-tenant-dialog',
  imports: [FormsModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2 mat-dialog-title>Evict {{ data.tenantName || 'current tenant' }}?</h2>
    <mat-dialog-content>
      <p>
        The tenancy for <b>{{ data.propertyName }}</b> will end and the property will become
        available.
      </p>
      <label class="field"
        ><span>Reason <em>Required</em></span
        ><textarea
          rows="3"
          [(ngModel)]="reason"
          placeholder="Explain why this tenant is being evicted"
        ></textarea>
      </label>
      <label class="field"
        ><span>Storage image URLs <small>Optional, one URL per line</small></span
        ><textarea
          rows="5"
          [(ngModel)]="imageUrls"
          placeholder="https://example.com/storage-1.jpg&#10;https://example.com/storage-2.jpg"
        ></textarea>
      </label>
      @if (invalidUrls.length) {
        <p class="error">Each storage image must be a valid HTTP or HTTPS URL.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end"
      ><button class="btn btn-secondary" type="button" mat-dialog-close>Cancel</button
      ><button
        class="btn btn-danger"
        type="button"
        [disabled]="!reason.trim() || invalidUrls.length > 0"
        (click)="confirm()"
      >
        Evict tenant
      </button></mat-dialog-actions
    >`,
  styles: [
    `
      mat-dialog-content {
        min-width: min(520px, 78vw);
      }
      :host {
        display: block;
        color: var(--ink);
      }
      p {
        color: var(--muted);
      }
      .field {
        margin-top: 18px;
      }
      .field span {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .field em {
        color: var(--danger);
        font-size: 0.7rem;
        font-style: normal;
      }
      .field small {
        color: var(--muted);
        font-weight: 500;
      }
      .error {
        color: var(--danger);
        font-size: 0.78rem;
        margin-top: 8px;
      }
    `,
  ],
})
export class EvictTenantDialogComponent {
  readonly data = inject<Property>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EvictTenantDialogComponent>);
  reason = '';
  imageUrls = '';
  get urls() {
    return this.imageUrls
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  get invalidUrls() {
    return this.urls.filter((value) => {
      try {
        const url = new URL(value);
        return !['http:', 'https:'].includes(url.protocol);
      } catch {
        return true;
      }
    });
  }
  confirm() {
    this.ref.close({ confirmed: true, reason: this.reason.trim(), storageImageUrls: this.urls });
  }
}
