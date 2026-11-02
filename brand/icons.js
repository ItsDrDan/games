/* ItsDrDan shared line-art icons (24-unit grid, stroke = currentColor).
   <script src="https://itsdrdan.github.io/games/brand/icons.js"></script> then ddIcon('flame') → inline <svg class="ui">.
   Pair with brand/itsdrdan.css (the .ui class). Add icons here, not in individual games. */
(function(){
var I={
 compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.6 13.6 8.5 15.5l1.9-5.1z"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
 clipboard:'<rect x="5" y="5" width="14" height="16" rx="2.5"/><path d="M9 5V3.5h6V5M9 11l2 2 4-4M9 16h6"/>',
 calendar:'<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M8 3v4M16 3v4"/>',
 dice:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>',
 sliders:'<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="#fff"/><circle cx="15" cy="12" r="2" fill="#fff"/><circle cx="8" cy="17" r="2" fill="#fff"/>',
 flame:'<path d="M12 3.5c1 3 4.5 4.5 4.5 9a4.5 4.5 0 0 1-9 0c0-1.6.6-2.8 1.5-3.8.2 1.6 1 2.4 1.9 2.4C11.4 9 10.7 6 12 3.5z"/>',
 pencil:'<path d="M4 20l4-1 10.5-10.5a1.8 1.8 0 0 0 0-2.6L17.1 4.5a1.8 1.8 0 0 0-2.6 0L4 15z"/><path d="M13 6l4.5 4.5"/>',
 eye:'<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>',
 arrow:'<path d="M5 12h13M13 7l5 5-5 5"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 party:'<path d="M5 20l4-11 7 7z"/><path d="M12 6l1-2M16 9l2-1M14 4.5l.5-1.5M18.5 5.5l1-1"/>',
 book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>',
 map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
 video:'<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/>',
 bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
 bridge:'<path d="M3 17h18M5 17V9M19 17V9M3 10q9-6 18 0"/><path d="M9 17v-5M12 17v-6M15 17v-5"/>',
 flask:'<path d="M9.5 3h5M10 3v6L4.5 18.5A1.8 1.8 0 0 0 6 21h12a1.8 1.8 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
 atom:'<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>',
 rocket:'<path d="M12 3c3 2 4.5 6 4.5 10l-2 2h-5l-2-2C7.5 9 9 5 12 3z"/><circle cx="12" cy="9.5" r="1.6"/><path d="M9.5 15l-3 3h3M14.5 15l3 3h-3M10.5 15l1.5 5 1.5-5"/>',
 stopwatch:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M10 3h4M12 3v3M18 7l1.5-1.5"/>',
 scale:'<path d="M12 4v16M6 20h12M4 8h16M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z"/>',
 gem:'<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9 4l3 5 3-5M9.5 9l2.5 11 2.5-11"/>',
 battery:'<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M19 10h2v4h-2M6 10v4M9.5 10v4M13 10v4"/>',
 droplet:'<path d="M12 3.5c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>',
 wave:'<path d="M3 9c3-3 6-3 9 0s6 3 9 0M3 15c3-3 6-3 9 0s6 3 9 0"/>',
 bolt:'<path d="M13 3L5 13h6l-1 8 9-11h-6z"/>',
 toolbox:'<rect x="3" y="8" width="18" height="12" rx="2.5"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M3 13h18"/>',
 loop:'<path d="M4 12a8 8 0 0 1 13.5-5.8L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.5 5.8L4 15.5M4 20v-4.5h4.5"/>',
 angle:'<path d="M4 20L20 20L4 5"/><path d="M12 20a8 8 0 0 0-3.3-6.5"/>',
 levels:'<path d="M5 20V9M12 20V4M19 20v-8"/><path d="M3 20h18"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h2M13.5 11h2M8.5 15h2M13.5 15h2"/>',
 sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
 thermometer:'<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v6"/>',
 gauge:'<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>',
 beaker:'<path d="M7 3h10M9 3v6l-5 9a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M6 15h12"/>',
 trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4q0 4 3 5M17 6h3q0 4-3 5M12 14v3M8 21h8M9 21l1-4h4l1 4"/>',
 home:'<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>'
};
window.DD_ICONS=I;
window.ddIcon=function(name,cls){return '<svg class="ui'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(I[name]||'')+'</svg>';};
})();
