export async function copyEmailToClipboard(
  email: string,
  clipboard?: Pick<Clipboard, 'writeText'>,
): Promise<boolean> {
  try {
    if (typeof clipboard?.writeText !== 'function') return false;

    await clipboard.writeText(email);
    return true;
  } catch {
    return false;
  }
}
