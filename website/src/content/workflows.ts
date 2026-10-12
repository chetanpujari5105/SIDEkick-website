/**
 * Homepage workflow showcase. Every claim traces to docs/content-audit.md (Features table).
 * Keep caveats honest: one meaningful limitation per category.
 */
export interface Workflow {
  id: 'mirror' | 'notifications' | 'files' | 'clipboard';
  tab: string;
  icon: string;
  heading: string;
  body: string;
  tasks: string[];
  caveat: { title: string; text: string };
  link: { label: string; href: string };
  visualLabel: string;
}

export const workflows: Workflow[] = [
  {
    id: 'mirror',
    tab: 'Mirror & control',
    icon: 'monitor-smartphone',
    heading: 'Use your phone without picking it up.',
    body: 'Put your phone’s screen in a Mac window — or a small floating one that stays on top — and drive it with your trackpad and keyboard.',
    tasks: [
      'Click, scroll and type into any app on the phone',
      'Use Back, Home and Recents from the Mac',
      'Keep the mirror floating above your work',
    ],
    caveat: {
      title: 'Android asks every time.',
      text: 'Each mirroring session starts with a tap on the phone to allow screen capture. Banking apps, protected video and the lock screen appear black — Android blocks them.',
    },
    link: { label: 'Mirroring setup', href: '/setup#mirroring' },
    visualLabel:
      'Illustration: the Sidekick Mirror screen on a Mac, showing a phone’s home screen with a pointer over it, a Mirroring session card with Stop and Float window buttons, and Back, Home and Recents controls.',
  },
  {
    id: 'notifications',
    tab: 'Notifications & messages',
    icon: 'bell',
    heading: 'Answer it from where you already are.',
    body: 'Phone notifications arrive on your Mac. Read them, act on them, and keep your text conversations going from the keyboard you’re typing on.',
    tasks: [
      'Reply to notifications that offer a reply — including chat apps that support it',
      'Read your text message threads and reply',
      'Dismiss on the Mac and it’s dismissed on the phone',
    ],
    caveat: {
      title: 'Replies depend on the app.',
      text: 'Sidekick can only reply where the notification itself offers a reply action. It is not a separate client for WhatsApp or any other messaging service.',
    },
    link: { label: 'Notification access', href: '/permissions#notifications' },
    visualLabel:
      'Illustration: the Sidekick Messages screen with three fictional conversations and a reply being typed to Jordan Lee.',
  },
  {
    id: 'files',
    tab: 'Files & photos',
    icon: 'folder',
    heading: 'Move the file, not the cable.',
    body: 'Send files from your Mac to your phone, browse the folders you choose to share, and pull photos and videos straight into Finder.',
    tasks: [
      'Send files to the phone — Sidekick shows where they’ll land first',
      'Browse shared phone folders and drag files to Finder',
      'Browse photos and videos and save the ones you need',
    ],
    caveat: {
      title: 'Only what you share.',
      text: 'Android lets Sidekick see the folders you grant it, not your whole storage. Files sitting directly in Download can’t be browsed — sent files go to Download › ConnectSuite instead.',
    },
    link: { label: 'How folder sharing works', href: '/help#folders' },
    visualLabel:
      'Illustration: the Sidekick Files screen sending two files to a phone, with the destination Download › ConnectSuite and a progress bar at 64 percent.',
  },
  {
    id: 'clipboard',
    tab: 'Clipboard & media',
    icon: 'clipboard',
    heading: 'Copy on one, paste on the other.',
    body: 'Text you copy on your Mac is ready to paste on your phone. And whatever your phone is playing, you can pause or skip without reaching for it.',
    tasks: [
      'Mac to phone: copied text arrives automatically',
      'Phone to Mac: copy while Sidekick is open on the phone, or share text to it',
      'Play, pause and skip your phone’s audio from the Mac',
    ],
    caveat: {
      title: 'The two directions differ.',
      text: 'Android doesn’t let apps read the clipboard in the background, so text only travels from the phone while Sidekick is open there or when you share it to Sidekick. Shared text waits on the Mac until you press Copy.',
    },
    link: { label: 'Clipboard in detail', href: '/help#clipboard' },
    visualLabel:
      'Illustration: the Sidekick Clipboard screen with text offered from the phone and a Copy button, earlier items sent from Mac to phone, and a Now playing card with playback controls.',
  },
];
