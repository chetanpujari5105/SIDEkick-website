/**
 * Public changelog. Dates are those recorded in the project's release documents for internal builds;
 * none of these is a public release. Internal defect numbers, paths and debugging detail are omitted.
 */
export const changelog = [
  {
    date: '2026-10-12',
    title: 'Release candidate 2.0.0 for the invited beta',
    items: [
      'Beta access tokens: a signed, 45-day token entered on the Mac and checked offline. When it ends, Sidekick opens read-only and deletes nothing.',
      'The Android app now calls itself Sidekick throughout.',
    ],
  },
  {
    date: '2026-10-11',
    title: 'Send files from Overview',
    items: ['A Send files button on the Mac’s Overview shows what will be sent and where before anything moves, then the progress.'],
  },
  {
    date: '2026-10-08',
    title: 'Pairing-code scanner runs entirely on the phone',
    items: ['The QR scanner was replaced with one that has no network access and no Google services, so the phone app contains no third-party service that sends data anywhere.'],
  },
  {
    date: '2026-10-07',
    title: 'Safer clipboard and received files',
    items: [
      'Text shared from the phone as a selection waits on the Mac until you press Copy, instead of replacing your clipboard.',
      'Files received on the Mac are marked as downloaded, so macOS checks them as it does any download.',
      'Photos and Files now say when a very large file copied from the phone couldn’t be verified.',
    ],
  },
  {
    date: '2026-10-06',
    title: 'Stronger pairing',
    items: [
      'Pairing now has both devices prove they saw the same code, and every connection — control, video and file transfer — checks the paired key. Phones paired with earlier builds need to pair again.',
      'Dropping a file onto the Mac window asks for confirmation before anything is sent.',
    ],
  },
  {
    date: '2026-09-17',
    title: 'ConnectSuite becomes Sidekick',
    items: ['New name and visual identity for the Mac app. Because the app’s identity changed, existing phones need to scan a new pairing code.'],
  },
];
