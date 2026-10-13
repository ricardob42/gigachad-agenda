<script>
  let { name, size = 20, stroke = 1.8 } = $props();

  const PATHS = {
    calendar: ['M6 5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z', 'M8 3v4M16 3v4M3 10h18'],
    week: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
    routines: ['M17 2l3 3-3 3', 'M4 11V9a4 4 0 0 1 4-4h12', 'M7 22l-3-3 3-3', 'M20 13v2a4 4 0 0 1-4 4H4'],
    look: ['M6 4h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z', 'M21 16l-5-5-9 9', 'M9 9h.01'],
    backup: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 20h16'],
    stats: ['M5 20v-9', 'M12 20V4', 'M19 20v-6'],
    search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-3.5-3.5'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    plus: ['M12 5v14M5 12h14'],
    close: ['M6 6l12 12M18 6L6 18'],
    focus: ['M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M12 9v4l2.5 1.5', 'M9.5 2.5h5'],
    move: ['M4 9h14l-3-3', 'M20 15H6l3 3'],
    copy: ['M9 9h11v11H9z', 'M5 15V4h11'],
    grip: ['M9 6h.01', 'M15 6h.01', 'M9 12h.01', 'M15 12h.01', 'M9 18h.01', 'M15 18h.01'],
    left: ['M15 6l-6 6 6 6'],
    right: ['M9 6l6 6-6 6'],
    down: ['M6 9l6 6 6-6'],
    lock: ['M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z', 'M8 11V8a4 4 0 0 1 8 0v3'],
    trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
    rest: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'],
    clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={name === 'grip' ? 3 : stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#each PATHS[name] as d}<path {d} />{/each}
</svg>
