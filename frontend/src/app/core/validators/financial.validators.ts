import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function depositAtLeastRentValidator(
  rentControlName = 'rent',
  depositControlName = 'securityDeposit',
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rent = control.get(rentControlName)?.value;
    const deposit = control.get(depositControlName)?.value;
    if (rent === null || rent === undefined || deposit === null || deposit === undefined)
      return null;
    return Number(deposit) >= Number(rent) ? null : { depositBelowRent: true };
  };
}
