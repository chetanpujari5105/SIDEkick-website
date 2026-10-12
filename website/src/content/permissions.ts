/**
 * From docs/privacy-policy-draft-2026-10-09.md §3 (release manifest, 31 entries) and the tester guide.
 * Grouped by what a person would recognise, with the system name kept for the technically curious.
 */
export interface PermissionGroup {
  id: string;
  feature: string;
  when: string;
  without: string;
  perms: { name: string; why: string }[];
}

export const androidPermissions: PermissionGroup[] = [
  {
    id: 'network',
    feature: 'Connecting to your Mac',
    when: 'Granted at install.',
    without: 'Sidekick can’t reach your Mac.',
    perms: [
      { name: 'INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, CHANGE_NETWORK_STATE, CHANGE_WIFI_STATE, CHANGE_WIFI_MULTICAST_STATE', why: 'The local link to the Mac and finding each other on the network. No internet destination is contacted.' },
      { name: 'NEARBY_WIFI_DEVICES (Android 13+, marked “never for location”)', why: 'Reading Wi-Fi network details, which Android requires for local discovery.' },
      { name: 'ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION (Android 12 and older only)', why: 'Android requires these on older versions to read Wi-Fi details. No location is read.' },
    ],
  },
  {
    id: 'background',
    feature: 'Staying connected',
    when: 'At install, plus a battery-optimisation request you can decline.',
    without: 'The link may drop when the phone sleeps.',
    perms: [
      { name: 'FOREGROUND_SERVICE, FOREGROUND_SERVICE_CONNECTED_DEVICE', why: 'Keeping the link to the Mac alive, with a visible notification.' },
      { name: 'WAKE_LOCK, RECEIVE_BOOT_COMPLETED, REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', why: 'Reconnecting after sleep and restart. While a Mac is connected the phone stays ready to answer it; this stops when the Mac sleeps or disconnects.' },
      { name: 'POST_NOTIFICATIONS', why: 'The connection’s status notification, and prompts for clipboard, sharing and opening apps.' },
    ],
  },
  {
    id: 'notifications',
    feature: 'Notifications on the Mac',
    when: 'Switched on by hand: Settings → Notification access → Sidekick.',
    without: 'No phone notifications appear on the Mac; everything else works.',
    perms: [{ name: 'Notification access (NotificationListenerService)', why: 'Reading notifications as they arrive so the Mac can show them, and acting on them — reply, actions, dismiss — when you ask.' }],
  },
  {
    id: 'messages',
    feature: 'Text messages',
    when: 'Asked on the phone the first time you use Messages.',
    without: 'Messages stays empty with a sentence saying why.',
    perms: [{ name: 'READ_SMS, RECEIVE_SMS, SEND_SMS', why: 'Showing your text threads and sending the replies you write on the Mac.' }],
  },
  {
    id: 'calls',
    feature: 'Calls',
    when: 'Asked on the phone the first time you use Calls.',
    without: 'No call events or call controls on the Mac.',
    perms: [{ name: 'READ_CALL_LOG, READ_PHONE_STATE, CALL_PHONE, ANSWER_PHONE_CALLS', why: 'Incoming-call events, recent calls, dialling and answering or declining from the Mac. Call audio stays on the phone.' }],
  },
  {
    id: 'contacts',
    feature: 'Contact names',
    when: 'Asked when names would first be shown.',
    without: 'Messages and calls show numbers instead of names.',
    perms: [{ name: 'READ_CONTACTS', why: 'Names and photos beside messages and calls.' }],
  },
  {
    id: 'photos',
    feature: 'Photos and videos',
    when: 'Asked on the phone the first time you use Photos. Choosing only some photos is respected.',
    without: 'The Photos screen explains what’s missing.',
    perms: [{ name: 'READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_VISUAL_USER_SELECTED, READ_EXTERNAL_STORAGE (Android 12 and older)', why: 'Browsing your photo and video library from the Mac.' }],
  },
  {
    id: 'folders',
    feature: 'Shared folders',
    when: 'When you grant a folder with Android’s folder picker.',
    without: 'Files sent from the Mac still arrive in Download › ConnectSuite.',
    perms: [{ name: 'Folder access (Storage Access Framework)', why: 'Browsing and copying from only the folders you choose.' }],
  },
  {
    id: 'mirroring',
    feature: 'Screen mirroring',
    when: 'Android’s own consent dialog, every session.',
    without: 'No mirroring; nothing else is affected.',
    perms: [{ name: 'Screen capture (MediaProjection), FOREGROUND_SERVICE_MEDIA_PROJECTION', why: 'Sending your screen to the Mac while you mirror.' }],
  },
  {
    id: 'control',
    feature: 'Controlling the phone from the Mac',
    when: 'Switched on by hand: Settings → Accessibility → Sidekick.',
    without: 'You can watch the mirror but not click or type into it.',
    perms: [{ name: 'Accessibility service', why: 'Turning your clicks, scrolls and typing on the Mac into touches and text on the phone, plus Back, Home, Recents, notifications, quick settings, lock screen and the power menu. Nothing else.' }],
  },
  {
    id: 'camera',
    feature: 'Scanning the pairing code',
    when: 'Asked when you tap Scan the code.',
    without: 'You can’t pair.',
    perms: [{ name: 'CAMERA', why: 'Reading the QR code on your Mac. The image is processed on the phone and goes nowhere. (The phone-as-camera feature is not in this build.)' }],
  },
];

export const macPermissions = [
  { name: 'Local Network', why: 'macOS asks the first time Sidekick looks for your phone. Without it, Sidekick can’t connect.' },
  { name: 'Notifications', why: 'Optional. Lets phone notifications appear as regular Mac notifications.' },
  { name: 'Login Keychain', why: 'Sidekick stores this Mac’s private key, sealed by macOS, under the name “Sidekick Safe Storage”. No password prompt is normally shown.' },
];
