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
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  requireReason?: boolean;
  dangerous?: boolean;
}
@Component({
  selector: 'app-confirm-dialog',
  imports: [
    FormsModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content
      ><p>{{ data.message }}</p>
      @if (data.requireReason) {
        <label class="field"
          ><span>Reason</span
          ><textarea rows="3" [(ngModel)]="reason" placeholder="Add a clear reason"></textarea>
        </label>
      }</mat-dialog-content
    ><mat-dialog-actions align="end"
      ><button mat-button mat-dialog-close>Cancel</button
      ><button
        mat-flat-button
        [class.danger]="data.dangerous"
        [disabled]="data.requireReason && !reason.trim()"
        (click)="confirm()"
      >
        {{ data.confirmLabel || 'Confirm' }}
      </button></mat-dialog-actions
    >`,
  styles: [
    `
      mat-dialog-content {
        min-width: min(440px, 75vw);
      }
      p {
        color: var(--muted);
      }
      .danger {
        background: var(--danger) !important;
        color: white !important;
      }
      .field {
        margin-top: 18px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ConfirmDialogComponent>);
  reason = '';
  confirm(): void {
    this.ref.close({ confirmed: true, reason: this.reason.trim() });
  }
}
