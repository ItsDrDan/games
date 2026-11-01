#!/usr/bin/env python3
"""Build assets/icons.svg — the hub's icon sprite (chapter badges, game fallbacks, UI icons).

Two kinds of icons, drawn to match each other (256-unit grid, 16-unit strokes, soft 20% "duotone" fill):
  * General UI icons come from Phosphor Icons (MIT license, https://phosphoricons.com), duotone weight.
  * Chemistry icons (benzene, lattice, orbitals, lipids, ...) are drawn by hand below.

Usage (run from the repo folder):
    npm i --prefix /tmp/phosphor @phosphor-icons/core
    python3 tools/build_icons.py /tmp/phosphor/node_modules/@phosphor-icons/core/assets/duotone

In the page, an icon is <svg class="ic"><use href="assets/icons.svg#i-NAME"/></svg>.
The icon takes its color from CSS `color`. To add an icon, add it to PHOSPHOR or CUSTOM and re-run.
"""
import re
import sys
from pathlib import Path

# hub name -> Phosphor icon name
PHOSPHOR = {
    'measure': 'ruler', 'atom': 'atom', 'gauge': 'gauge', 'scales': 'scales', 'fire': 'fire',
    'radioactive': 'radioactive', 'exam': 'exam', 'timer': 'timer', 'thermometer': 'thermometer',
    'battery': 'battery-charging', 'dna': 'dna', 'lightning': 'lightning', 'bridge': 'bridge',
    'cards': 'cards', 'flask': 'flask',
    'fuel': 'gas-pump', 'wine': 'wine', 'bread': 'bread', 'avocado': 'avocado', 'egg': 'egg',
    # UI
    'search': 'magnifying-glass', 'book': 'book-open', 'game': 'game-controller', 'video': 'play-circle',
    'note': 'note-pencil', 'check': 'check-circle', 'books': 'books', 'finish': 'flag-checkered',
    'idea': 'lightbulb', 'tools': 'wrench', 'calendar': 'calendar-dots', 'map': 'map-trifold',
    'warning': 'warning', 'film': 'film-slate', 'brain': 'brain', 'chat': 'chat-circle-text',
    'heart': 'heart', 'repeat': 'arrows-clockwise', 'rest': 'moon-stars', 'fullscreen': 'corners-out',
    'list': 'list-checks',
}

D = 'fill="currentColor" opacity=".2"'          # duotone fill
W = 'fill="#fff"'                                # paper fill (sits on pastel tiles)
S = 'fill="currentColor"'                        # solid
T = 'fill="currentColor" font-family="Inter,system-ui,sans-serif" font-weight="800" text-anchor="middle"'


def hexagon(cx, cy, r, flat=False):
    import math
    a0 = 0 if flat else 90
    pts = [(cx + r * math.cos(math.radians(a0 + 60 * k)), cy - r * math.sin(math.radians(a0 + 60 * k))) for k in range(6)]
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'


def cycle(inner):
    """A circular 'metabolism' arrow wrapped around an inner drawing."""
    return (f'<circle cx="128" cy="128" r="64" {D}/>'
            '<path d="M214 128a86 86 0 1 1-25.2-60.8"/><path d="M196 36v36h-36"/>' + inner)


CUSTOM = {
    # --- general chemistry ---
    'periodic': ''.join(f'<rect x="{18 + c * 37}" y="{40 + r * 46}" width="33" height="40" rx="7" fill="currentColor" '
                        f'opacity="{1 if (r, c) in ((0, 0), (2, 4)) else .4}" stroke="none"/>'
                        for r, cols in enumerate(((0, 5), (0, 1, 3, 4, 5), (0, 1, 3, 4, 5), range(6))) for c in cols),
    'lattice': '<path d="M60 60H196V196H60ZM60 128H196M128 60V196"/>'
               + ''.join(f'<circle cx="{x}" cy="{y}" r="{26 if (i + j) % 2 == 0 else 15}" '
                         f'{W if (i + j) % 2 == 0 else S}/>'
                         for i, x in enumerate((60, 128, 196)) for j, y in enumerate((60, 128, 196)))
               + ''.join(f'<circle cx="{x}" cy="{y}" r="26" {D} stroke="none"/>'
                         for i, x in enumerate((60, 128, 196)) for j, y in enumerate((60, 128, 196)) if (i + j) % 2 == 0),
    'pile': ''.join(f'<circle cx="{x}" cy="{y}" r="32" {W}/><circle cx="{x}" cy="{y}" r="32" {D} stroke="none"/>'
                    for x, y in ((64, 192), (128, 192), (192, 192), (96, 136), (160, 136), (128, 80)))
            + f'<path d="M212 28l6 16 16 6-16 6-6 16-6-16-16-6 16-6z" {S} stroke-width="6"/>',
    'molecule': '<path d="M128 136V58M128 136L56 186"/>'
                f'<path d="M134 128L202 176L192 192Z" {S} stroke-width="6"/>'
                '<path d="M120 130L70 98" stroke-dasharray="2 22"/>'
                f'<circle cx="128" cy="136" r="34" {W}/><circle cx="128" cy="136" r="34" {D} stroke="none"/>'
                f'<circle cx="128" cy="44" r="22" {W}/><circle cx="48" cy="192" r="22" {W}/>'
                f'<circle cx="206" cy="190" r="22" {W}/><circle cx="56" cy="86" r="20" {W}/>',
    'phases': '<path d="M96 40L152 68V132L96 160L40 132V68Z" ' + W + '/>'
              f'<path d="M40 68L96 96L152 68L96 40Z" {D} stroke="none"/>'
              '<path d="M40 68L96 96L152 68M96 96V160"/>'
              f'<path d="M188 120s44 48 44 76a44 44 0 0 1-88 0c0-28 44-76 44-76Z" {W}/>'
              f'<path d="M188 120s44 48 44 76a44 44 0 0 1-88 0c0-28 44-76 44-76Z" {D} stroke="none"/>'
              '<path d="M168 200a20 20 0 0 0 20 20"/>',
    'solution': f'<path d="M72 120H184V176a40 40 0 0 1-40 40H112a40 40 0 0 1-40-40Z" {D} stroke="none"/>'
                '<path d="M52 40H204M72 40V176a40 40 0 0 0 40 40h32a40 40 0 0 0 40-40V40M72 120H184"/>'
                f'<circle cx="104" cy="160" r="12" {S} stroke="none"/><circle cx="152" cy="180" r="12" {S} stroke="none"/>'
                '<circle cx="146" cy="146" r="10" stroke-width="10"/><circle cx="110" cy="194" r="8" stroke-width="10"/>',
    'reaction': f'<path d="M66 176H190L206 204a14 14 0 0 1-12 20H62a14 14 0 0 1-12-20Z" {D} stroke="none"/>'
                '<path d="M80 40H176M104 40V104L50 204a14 14 0 0 0 12 20H194a14 14 0 0 0 12-20L152 104V40M66 176H190"/>'
                '<circle cx="112" cy="198" r="8" stroke-width="10"/><circle cx="146" cy="150" r="10" stroke-width="10"/>'
                '<path d="M200 24l-16 24M232 64l-28 8M196 96l20 10"/>',
    'ph': f'<path d="M128 20s-76 86-76 140a76 76 0 0 0 152 0c0-54-76-140-76-140Z" {D} stroke="none"/>'
          '<path d="M128 20s-76 86-76 140a76 76 0 0 0 152 0c0-54-76-140-76-140Z"/>'
          f'<text x="128" y="196" font-size="78" {T} stroke="none">pH</text>',
    'equilibrium': f'<circle cx="128" cy="128" r="104" {D} stroke="none"/>'
                   '<path d="M44 100H212L172 64M212 156H44L84 192"/>',
    'orbital': f'<ellipse cx="128" cy="72" rx="34" ry="52" {D} stroke="none"/><ellipse cx="128" cy="184" rx="34" ry="52" {D} stroke="none"/>'
               '<ellipse cx="128" cy="72" rx="34" ry="52"/><ellipse cx="128" cy="184" rx="34" ry="52"/>'
               '<ellipse cx="72" cy="128" rx="52" ry="34" stroke-dasharray="1 24"/><ellipse cx="184" cy="128" rx="52" ry="34" stroke-dasharray="1 24"/>'
               f'<circle cx="128" cy="128" r="12" {S} stroke="none"/>',
    'complex': '<path d="M128 128V40M128 128V216M128 128H40M128 128H216"/>'
               f'<path d="M122 124L188 180L176 192Z" {S} stroke-width="6"/>'
               '<path d="M118 118L74 74" stroke-dasharray="2 20"/>'
               f'<circle cx="128" cy="128" r="36" {W}/><circle cx="128" cy="128" r="36" {D} stroke="none"/>'
               f'<text x="128" y="146" font-size="52" {T} stroke="none">M</text>'
               + ''.join(f'<circle cx="{x}" cy="{y}" r="18" {W}/>' for x, y in ((128, 32), (128, 224), (32, 128), (224, 128), (192, 196), (66, 66))),
    # --- organic & biochem ---
    'organic': f'<path d="{hexagon(76, 152, 56)}" {D} stroke="none"/><path d="{hexagon(76, 152, 56)}"/>'
               '<path d="M124.5 124L172 152L220 124M172 152V212M220 124V64"/>',
    'hydrocarbon': '<path d="M20 168L68 108L116 168M59 129L94 172"/>'
                   '<path d="M116 168H236M124 136H228M124 200H228"/>',
    'benzene': f'<path d="{hexagon(128, 128, 104)}" {D} stroke="none"/><path d="{hexagon(128, 128, 104)}"/>'
               '<circle cx="128" cy="128" r="54"/>',
    'alcohol': '<path d="M20 176L68 120L116 176L160 124"/>'
               f'<text x="204" y="128" font-size="68" {T} stroke="none">OH</text>'
               f'<circle cx="68" cy="120" r="10" {S} stroke="none"/><circle cx="116" cy="176" r="10" {S} stroke="none"/>',
    'carbonyl': '<path d="M32 208L128 156L224 208M114 148V88M142 148V88"/>'
                f'<circle cx="128" cy="56" r="40" {D} stroke="none"/>'
                f'<text x="128" y="82" font-size="76" {T} stroke="none">O</text>',
    'acid': '<path d="M24 196L96 156M84 148V84M108 148V84M96 156L148 186"/>'
            f'<circle cx="96" cy="54" r="38" {D} stroke="none"/>'
            f'<text x="96" y="76" font-size="62" {T} stroke="none">O</text>'
            f'<text x="196" y="222" font-size="62" {T} stroke="none">OH</text>',
    'amine': f'<circle cx="150" cy="118" r="88" {D} stroke="none"/><path d="M12 200L52 152L92 200"/>'
             f'<text x="150" y="146" font-size="92" {T} stroke="none">NH<tspan font-size="52" dy="20">2</tspan></text>',
    'chirality': '<path d="M128 24V232" stroke-dasharray="2 22"/>'
                 '<path d="M76 128V56M76 128L32 168"/><path d="M224 168L180 128V56"/>'
                 f'<path d="M80 122L108 180L92 188Z" {S} stroke-width="6"/><path d="M176 122L148 180L164 188Z" {S} stroke-width="6"/>'
                 + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" {W}/>' for x, y, r in
                           ((76, 128, 22), (180, 128, 22), (76, 48, 16), (180, 48, 16), (28, 172, 16), (228, 172, 16),
                            (102, 194, 16), (154, 194, 16)))
                 + f'<circle cx="76" cy="128" r="22" {D} stroke="none"/><circle cx="180" cy="128" r="22" {D} stroke="none"/>',
    'sugar': f'<path d="M72 88H184L216 128L176 176H80L40 128Z" {D} stroke="none"/>'
             '<path d="M164 88H72L40 128L80 176H176L216 128L200 108"/><path d="M80 176H176" stroke-width="30"/>'
             '<path d="M72 88V36"/>'
             f'<text x="186" y="106" font-size="54" {T} stroke="none">O</text>',
    'lipid': f'<circle cx="128" cy="56" r="36" {D} stroke="none"/><circle cx="128" cy="56" r="36"/>'
             '<path d="M108 90L88 120L108 150L88 180L108 210L88 236M148 90L168 120L148 150L168 180L148 210L168 236"/>',
    'protein': '<path d="M40 196L84 152L56 104L108 64L164 92L212 56"/>'
               + ''.join(f'<circle cx="{x}" cy="{y}" r="22" {W}/>'
                         + (f'<circle cx="{x}" cy="{y}" r="22" {D} stroke="none"/>' if k % 2 == 0 else '')
                         for k, (x, y) in enumerate(((40, 196), (84, 152), (56, 104), (108, 64), (164, 92), (212, 56)))),
    'enzyme': f'<path d="M196 92A88 88 0 1 0 196 164L148 128Z" {D} stroke="none"/>'
              '<path d="M196 92A88 88 0 1 0 196 164L148 128Z"/>'
              f'<path d="M172 128L228 92V164Z" {S} stroke-width="8"/>',
    'carbmetab': cycle(f'<path d="{hexagon(128, 128, 34)}" {W}/>'),
    'lipidmetab': cycle('<path d="M92 140L110 112L128 140L146 112L164 140"/>'),
    'aametab': cycle(''.join(f'<circle cx="{x}" cy="128" r="14" {W}/>' for x in (96, 128, 160))),
    # --- game fallbacks ---
    'sigfig': f'<rect x="20" y="52" width="216" height="152" rx="24" {D} stroke="none"/><rect x="20" y="52" width="216" height="152" rx="24"/>'
              f'<text x="128" y="152" font-size="84" {T} stroke="none">3.50</text>'
              '<path d="M56 176H92M118 176H154M170 176H206"/>',
    'ion': '<path d="M44 40H24V216H44M212 40H232V216H212"/>'
           '<path d="M128 132V64M128 132L76 172M128 132L180 172"/>'
           f'<circle cx="128" cy="132" r="28" {W}/><circle cx="128" cy="132" r="28" {D} stroke="none"/>'
           f'<circle cx="128" cy="60" r="18" {W}/><circle cx="72" cy="176" r="18" {W}/><circle cx="184" cy="176" r="18" {W}/>'
           f'<text x="220" y="36" font-size="44" {T} stroke="none">2−</text>',
    'formula': f'<rect x="16" y="56" width="224" height="144" rx="24" {D} stroke="none"/><rect x="16" y="56" width="224" height="144" rx="24"/>'
               f'<text x="128" y="152" font-size="76" {T} stroke="none">NaCl</text>',
}


def phosphor_symbol(src: Path) -> str:
    svg = src.read_text()
    inner = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
    return f'<g fill="currentColor">{inner}</g>'


def mirrored_hands(pdir):
    inner = re.search(r'<svg[^>]*>(.*)</svg>', (pdir / 'hand-palm-duotone.svg').read_text(), re.S).group(1)
    return ('<g fill="currentColor">'
            f'<g transform="translate(-6 28) scale(.72)">{inner}</g>'
            f'<g transform="translate(262 28) scale(-.72 .72)">{inner}</g></g>'
            '<path d="M128 20V236" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 22" fill="none"/>')


def main():
    pdir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    out = ['<svg xmlns="http://www.w3.org/2000/svg">',
           '<!-- Dr. Dan\'s Study Hub icons. UI icons: Phosphor Icons (MIT, phosphoricons.com). '
           'Chemistry icons: drawn for this hub. Rebuild with tools/build_icons.py -->']
    for name, pname in PHOSPHOR.items():
        out.append(f'<symbol id="i-{name}" viewBox="0 0 256 256">{phosphor_symbol(pdir / f"{pname}-duotone.svg")}</symbol>')
    for name, body in CUSTOM.items():
        out.append(f'<symbol id="i-{name}" viewBox="0 0 256 256"><g fill="none" stroke="currentColor" stroke-width="16" '
                   f'stroke-linecap="round" stroke-linejoin="round">{body}</g></symbol>')
    out.append(f'<symbol id="i-hands" viewBox="0 0 256 256">{mirrored_hands(pdir)}</symbol>')
    out.append('</svg>')
    dest = Path(__file__).resolve().parent.parent / 'assets' / 'icons.svg'
    dest.write_text('\n'.join(out) + '\n')
    print(f'wrote {dest} ({len(PHOSPHOR) + len(CUSTOM) + 1} icons)')


if __name__ == '__main__':
    main()
