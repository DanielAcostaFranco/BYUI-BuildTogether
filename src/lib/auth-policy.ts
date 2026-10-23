export function isDemoAddress(email: string) {
  return email.trim().toLowerCase().endsWith('@example.invalid');
}

export function canUseSignInEmail(email: string, development: boolean, existingDemoUser: boolean) {
  return !isDemoAddress(email) || (development && existingDemoUser);
}
