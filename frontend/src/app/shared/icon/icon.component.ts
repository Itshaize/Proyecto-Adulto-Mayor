import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon', standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name) {
        @case ('home') { <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/> }
        @case ('user') { <circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/> }
        @case ('pill') { <path d="m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m7 10 7 7"/> }
        @case ('history') { <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/> }
        @case ('bell') { <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/> }
        @case ('settings') { <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.1.4.3.7.6 1 .3.2.6.4 1 .4h.1v4H21a1.7 1.7 0 0 0-1.6.6Z"/> }
        @case ('heart') { <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/><path d="M3.5 12H8l1.5-3 3 7 2-4h6"/> }
        @case ('droplet') { <path d="M12 2.8S5 10.2 5 15a7 7 0 0 0 14 0c0-4.8-7-12.2-7-12.2Z"/><path d="M9 16.5a3 3 0 0 0 3 2.2"/> }
        @case ('clock') { <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/> }
        @case ('wifi') { <path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01M2 9a14 14 0 0 1 20 0"/> }
        @case ('plus') { <path d="M12 5v14M5 12h14"/> }
        @case ('search') { <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/> }
        @case ('edit') { <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/> }
        @case ('trash') { <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/> }
        @case ('check') { <path d="m5 12 4 4L19 6"/> }
        @case ('alert') { <path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/> }
        @case ('info') { <circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/> }
        @case ('calendar') { <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/> }
        @case ('logout') { <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/> }
        @case ('chevron') { <path d="m9 18 6-6-6-6"/> }
        @case ('filter') { <path d="M4 5h16M7 12h10M10 19h4"/> }
        @case ('device') { <rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/> }
        @default { <circle cx="12" cy="12" r="9"/> }
      }
    </svg>`
})
export class IconComponent { @Input({ required: true }) name = ''; @Input() size = 22; }

