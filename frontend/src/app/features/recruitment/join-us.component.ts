import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCheck, LucideSend } from '@lucide/angular';
import { PHONE_NUMBER_PATTERN, PHONE_NUMBER_PLACEHOLDER } from '../../core/constants/app.constants';
import { RecruitmentService } from '../../core/services/management.services';

@Component({
  selector: 'app-join-us',
  imports: [ReactiveFormsModule, LucideCheck, LucideSend],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="application-section">
    <div class="container application-shell">
      <header>
        <p class="eyebrow">Careers at Imperial Estates</p>
        <h1>Recruitment application.</h1>
        <p>
          All fields are required. Submit one complete application using concise, honest answers in
          your own words.
        </p>
      </header>

      @if (submitted()) {
        <div class="success panel">
          <span><svg lucideCheck></svg></span>
          <div>
            <p class="eyebrow">Application received</p>
            <h2>Thank you for applying.</h2>
            <p>
              Your application is now pending management review. Please avoid submitting another
              application while this one is active.
            </p>
          </div>
        </div>
      } @else {
        <form class="panel" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-section">
            <div>
              <h3>Character details</h3>
              <p>Information used to identify and contact you in the city.</p>
            </div>
          </div>
          <div class="field-grid">
            <label class="field">
              <span>Character name</span>
              <input formControlName="characterName" autocomplete="name" />
              @if (invalid('characterName')) {
                <small class="error">Enter your character name.</small>
              }
            </label>
            <label class="field">
              <span>Character CID</span>
              <input type="number" min="1" step="1" formControlName="characterCid" />
              @if (invalid('characterCid')) {
                <small class="error">Enter a valid CID.</small>
              }
            </label>
            <label class="field">
              <span>Character phone number</span>
              <input
                formControlName="characterPhoneNumber"
                inputmode="tel"
                maxlength="8"
                [placeholder]="phonePlaceholder"
              />
              @if (invalid('characterPhoneNumber')) {
                <small class="error">Use the format 123-4567.</small>
              }
            </label>
            <label class="field">
              <span>Discord ID</span>
              <input
                formControlName="discordId"
                inputmode="numeric"
                placeholder="Your numeric Discord account ID"
              />
              @if (invalid('discordId')) {
                <small class="error">Enter a valid numeric Discord ID.</small>
              }
            </label>
          </div>

          <div class="form-section second">
            <div>
              <h3>Experience and motivation</h3>
              <p>Help us understand what you would bring to Imperial Estates.</p>
            </div>
          </div>
          <div class="long-fields">
            <label class="field">
              <span>Why do you want to join Imperial Estates?</span>
              <textarea rows="5" formControlName="reasonToJoin"></textarea>
              @if (invalid('reasonToJoin')) {
                <small class="error">Write at least 20 characters.</small>
              }
            </label>
            <label class="field">
              <span>Total playtime</span>
              <input formControlName="totalPlaytime" placeholder="Example: 240 hours" />
              @if (invalid('totalPlaytime')) {
                <small class="error">Enter your total playtime.</small>
              }
            </label>
            <label class="field">
              <span>What skills would be beneficial to Imperial Estates?</span>
              <textarea rows="5" formControlName="beneficialSkills"></textarea>
              @if (invalid('beneficialSkills')) {
                <small class="error">Write at least 20 characters.</small>
              }
            </label>
            <label class="field">
              <span>What days and times are you usually available?</span>
              <textarea rows="4" formControlName="availability"></textarea>
              @if (invalid('availability')) {
                <small class="error">Describe your usual availability.</small>
              }
            </label>
          </div>
          <footer>
            <p>Management will use your Discord ID to contact you about the outcome.</p>
            @if (failed()) {
              <span class="submit-error"
                >Application could not be submitted. Check your details and try again.</span
              >
            }
            <button class="btn btn-primary" [disabled]="form.invalid || submitting()">
              <svg lucideSend></svg>{{ submitting() ? 'Submitting…' : 'Submit application' }}
            </button>
          </footer>
        </form>
      }
    </div>
  </section>`,
  styles: [
    `
      .application-section {
        min-height: calc(100vh - 76px);
        padding: 52px 0 90px;
        background: var(--surface-soft);
      }
      .application-shell {
        max-width: 1120px;
      }
      .application-shell > header {
        margin-bottom: 28px;
      }
      .application-shell > header h1 {
        margin: 7px 0;
        font-size: clamp(2.7rem, 5vw, 4.4rem);
      }
      .application-shell > header p:last-child {
        max-width: 680px;
        margin-bottom: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      form {
        padding: clamp(22px, 4vw, 44px);
      }
      .form-section {
        margin-bottom: 22px;
        padding-left: 14px;
        border-left: 2px solid var(--forest);
      }
      .form-section.second {
        margin-top: 38px;
        padding-top: 0;
      }
      .form-section h3,
      .form-section p {
        margin: 0;
      }
      .form-section p {
        margin-top: 3px;
        color: var(--muted);
        font-size: 0.78rem;
      }
      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        align-items: start;
      }
      .long-fields {
        display: grid;
        gap: 18px;
      }
      .field-grid .field,
      .long-fields .field {
        position: relative;
        padding-bottom: 18px;
      }
      .field-grid .error,
      .long-fields .error {
        position: absolute;
        left: 0;
        bottom: 0;
        max-width: 100%;
        overflow: hidden;
        line-height: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 30px;
        padding-top: 24px;
        border-top: 1px solid var(--border);
      }
      footer p {
        margin: 0 auto 0 0;
        color: var(--muted);
        font-size: 0.76rem;
      }
      footer .btn svg {
        width: 16px;
      }
      .submit-error {
        max-width: 270px;
        color: var(--danger);
        font-size: 0.74rem;
        font-weight: 650;
      }
      .success {
        display: flex;
        gap: 20px;
        padding: 38px;
      }
      .success > span {
        display: grid;
        flex: 0 0 50px;
        width: 50px;
        height: 50px;
        place-items: center;
        border-radius: 50%;
        background: var(--available-bg);
        color: var(--available-ink);
      }
      .success h2 {
        margin: 7px 0;
      }
      .success p:last-child {
        margin: 0;
        color: var(--muted);
      }
      @media (max-width: 600px) {
        .application-section {
          padding-top: 36px;
        }
        .field-grid {
          grid-template-columns: 1fr;
        }
        footer {
          align-items: stretch;
          flex-direction: column;
        }
        footer p {
          margin: 0;
        }
      }
    `,
  ],
})
export class JoinUsComponent {
  private readonly recruitment = inject(RecruitmentService);
  readonly phonePlaceholder = PHONE_NUMBER_PLACEHOLDER;
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly failed = signal(false);
  readonly form = new FormGroup({
    characterName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(160)],
    }),
    characterCid: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    characterPhoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PHONE_NUMBER_PATTERN)],
    }),
    discordId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{15,22}$/)],
    }),
    reasonToJoin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20), Validators.maxLength(2000)],
    }),
    totalPlaytime: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    beneficialSkills: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20), Validators.maxLength(2000)],
    }),
    availability: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
  });

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.submitting.set(true);
    this.failed.set(false);
    this.recruitment
      .create({
        ...value,
        characterCid: value.characterCid!,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
        },
        error: () => {
          this.submitting.set(false);
          this.failed.set(true);
        },
      });
  }
}
