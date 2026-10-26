const paths = {
  helicopter: 'M3 4h16m-8 0v4M7 8h8l5 5v4H8l-3-5H2V9m8 1h4l3 3h-7v-3ZM7 20h14M9 17v3m8-3v3',
  squad: 'M5 20v-5a4 4 0 0 1 8 0v5M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M15 5a3 3 0 0 1 0 6m1 3a4 4 0 0 1 4 4v2',
  shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6',
  barrier: 'M3 8h18v7H3zM6 15v6m12-6v6M4 8l7 7m1-7 7 7M6 3v3m12-3v3',
  net: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v16m6-16v16',
  water:
    'M3 10h13v8H3zm13 3h3l3 3v2h-6M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4m12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4M7 7V4h8m-1 0 4-2m-4 2 5 1',
  drone: 'M9 9h6v6H9zM9 9 5 5m10 4 4-4m-4 10 4 4M9 15l-4 4M2 5h6m11-3v6M2 19h6m11-3v6',
  voice: 'M4 5h16v11H9l-5 4V5Zm4 4h8m-8 3h5',
  pulse: 'M12 2v4m0 12v4M2 12h4m12 0h4M5 5l3 3m8 8 3 3M5 19l3-3m8-8 3-3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  play: 'm8 4 12 8-12 8V4Z',
  pause: 'M8 4v16M16 4v16',
  arrow: 'm5 12 14 0m-6-6 6 6-6 6',
  city: 'M3 21V9h6v12m0 0V3h7v18m0-9h5v9M6 12v1m6-6v1m0 3v1m7 4v1M2 21h20',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3 5h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12',
  heart: 'M12 20 4 12A5 5 0 0 1 12 5a5 5 0 0 1 8 7l-8 8Z',
  plus: 'M12 4v16M4 12h16',
  minus: 'M4 12h16',
  close: 'm6 6 12 12M6 18 18 6',
  sound: 'M3 9h4l5-5v16l-5-5H3V9Zm13-3a9 9 0 0 1 0 12m0-8a3 3 0 0 1 0 4',
  lock: 'M6 10h12v11H6zm3 0V6a3 3 0 0 1 6 0v4m-3 4v3',
  repair: 'm14 5 5 5M3 21l9-9m2-9a6 6 0 0 0-6 8l5 5a6 6 0 0 0 8-6l-5 2-4-4 2-5',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
};
export const icon = name =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] ?? paths.city}"/></svg>`;
