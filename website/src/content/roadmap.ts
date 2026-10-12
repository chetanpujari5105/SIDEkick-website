/**
 * Public roadmap. Direction, not promises: no dates, no "coming soon".
 * Source: the owner's next-version planning notes (2026-10-12), cross-checked against the
 * release tracker for what already exists. Never name a competitor here.
 */
export interface RoadmapItem {
  title: string;
  text: string;
}
export interface RoadmapGroup {
  id: string;
  label: string;
  summary: string;
  items: RoadmapItem[];
}

export const roadmap: RoadmapGroup[] = [
  {
    id: 'now',
    label: 'First: make today’s features dependable',
    summary: 'Before anything new, the work that makes the current single-phone, single-Mac setup reliable for more people.',
    items: [
      { title: 'Connection health at a glance', text: 'Show whether a problem is the phone, the network, the pairing or the app — and what to do next.' },
      { title: 'Guided reconnect and recovery', text: 'Step-by-step recovery instead of reinstalling or guessing.' },
      { title: 'Quieter in the background', text: 'Less background activity on the phone and calmer diagnostics.' },
      { title: 'Clear file destinations', text: 'Choose where files land and see it named plainly every time.' },
      { title: 'Integrity checks for very large files', text: 'Verify big files from the phone block by block, so every transfer can say “checked”.' },
    ],
  },
  {
    id: 'next',
    label: 'Planned next: everyday improvements',
    summary: 'Extensions of features Sidekick already has.',
    items: [
      { title: 'Menu bar controls', text: 'Connection, battery, clipboard, transfers and mirroring from the Mac menu bar, without opening the window.' },
      { title: 'Notification grouping and per-app filters', text: 'Fewer interruptions, and the important ones easier to find.' },
      { title: 'Transfer queue with progress and time left', text: 'Send several batches without one waiting on another, with speed and time remaining.' },
      { title: 'Resume interrupted transfers', text: 'Pick up a large file where it stopped after a disconnect.' },
      { title: 'Clipboard search, pinning and resend', text: 'Find and reuse something you copied earlier.' },
      { title: 'Images on the clipboard', text: 'Copy supported images between devices, not just text.' },
      { title: 'Mirroring quality presets, screenshots and recording', text: 'Choose sharper or lighter mirroring, and capture what’s on screen with clear indicators.' },
    ],
  },
  {
    id: 'exploring',
    label: 'Exploring: separate projects, not promised',
    summary: 'Larger pieces of work that each need their own research and may not ship.',
    items: [
      { title: 'Your phone as a Mac camera', text: 'A camera other Mac apps can select. Early work exists; it is switched off in current builds.' },
      { title: 'Your phone’s microphone as a Mac input', text: 'Selectable in Mac apps, with obvious start and stop indicators.' },
      { title: 'Advanced mirroring', text: 'Phone audio on the Mac, mirroring with the phone screen off, and single apps in their own Mac windows. Likely to need Android’s wireless debugging switched on.' },
      { title: 'One phone, two Macs', text: 'Move between desks without pairing again.' },
      { title: 'Calls through your Mac’s microphone and speakers', text: 'Research only. Android doesn’t currently allow apps like Sidekick to do this, and we won’t promise it.' },
    ],
  },
];
