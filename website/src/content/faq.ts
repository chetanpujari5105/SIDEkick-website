export interface Faq {
  q: string;
  /** Plain text; paragraphs separated by blank lines. */
  a: string;
}
export const faq: Faq[] = [
  { q: 'Do I need both apps?', a: 'Yes. Sidekick is two apps that work as a pair: one on your Mac, one on your Android phone. Neither does anything useful on its own.' },
  { q: 'Do both devices need to be on the same Wi-Fi?', a: 'They need to be on the same local network. That can be your home or office Wi-Fi, or your Mac joined to your phone’s hotspot. Sidekick doesn’t connect across the internet.\n\nSome public or office networks stop devices from seeing each other; on those, the hotspot is the simplest option.' },
  { q: 'Do I need an account?', a: 'There’s no Sidekick account for the apps. During the beta you enter an access token on your Mac; it’s checked on the Mac and nothing is sent anywhere. How Sidekick will be licensed after the beta hasn’t been decided — if that ever involves an online check, it will be explained before you install.' },
  { q: 'Can I control my Android screen from the Mac?', a: 'Yes. While mirroring, you can click, scroll and type into the phone and use Back, Home and Recents. Control uses an Android accessibility service that you switch on yourself in Settings. Android asks you to allow screen capture at the start of every mirroring session.' },
  { q: 'Can I reply to WhatsApp messages?', a: 'You can reply to a WhatsApp notification from your Mac when the notification offers a reply — the same reply you could type from the phone’s notification shade. Sidekick isn’t a WhatsApp client: it can’t show your chat history or start new WhatsApp chats.' },
  { q: 'Does call audio play through my Mac?', a: 'No. Sidekick shows incoming calls and lets you answer, decline and dial from the Mac, but the conversation happens on your phone. Android doesn’t let apps like Sidekick carry call audio.' },
  { q: 'How does clipboard sharing work?', a: 'Text you copy on your Mac goes to your phone automatically. From the phone, Android only lets Sidekick read the clipboard while it’s open, so copy with Sidekick open or share the text to Sidekick. Shared text waits on the Mac until you press Copy. Clipboard history is kept in memory only, and cleared when the connection ends.' },
  { q: 'How do I get beta access?', a: 'The beta is invite-only and small. Request access and, if there’s a place, you’ll get both apps, a setup guide and a personal access token that runs for 45 days from the date it’s issued.' },
];
