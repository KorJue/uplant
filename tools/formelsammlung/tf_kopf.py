"""Kleine Zeichenbibliothek für die Formelsammlungs-Figuren.

Sie kennt nur, was für SVG-Skizzen in einem Druckstück nötig ist — und sie
prüft dabei mit, dass nichts aus der Zeichenfläche herausragt.
"""

BLAU = "#1d4ed8"
GRUEN = "#157347"
ORANGE = "#b3650a"
ROT = "#b3261e"
VIOLETT = "#6d28d9"
GRAU = "#5b6570"
SCHWARZ = "#1f2328"
GITTER = "#d5dae0"
RAHMEN = "#aeb6c0"

AUS = []
BILD_B = [400.0]
BILD_H = [400.0]


def setze_flaeche(breite, hoehe):
    BILD_B[0] = float(breite)
    BILD_H[0] = float(hoehe)


def f(x):
    """Eine Zahl kurz und ohne überflüssige Nullen für ein SVG-Attribut."""
    return f"{x:.2f}".rstrip("0").rstrip(".") if isinstance(x, float) else str(x)


def de(x, stellen=0):
    """Deutsche Zahlschreibweise mit echtem Minuszeichen."""
    s = f"{x:.{stellen}f}"
    if s.startswith("-"):
        s = "−" + s[1:]
    ganz, _, rest = s.partition(".")
    vorz = ""
    if ganz.startswith("−"):
        vorz, ganz = ganz[0], ganz[1:]
    gruppen = []
    while len(ganz) > 3:
        gruppen.insert(0, ganz[-3:])
        ganz = ganz[:-3]
    gruppen.insert(0, ganz)
    ganz = ".".join(gruppen) if len(gruppen) > 1 else gruppen[0]
    return vorz + ganz + ("," + rest if rest else "")


def pruefe_im_bild(x, y, was=""):
    assert -2 <= x <= BILD_B[0] + 2, f"{was}: x = {x} liegt außerhalb von 0..{BILD_B[0]}"
    assert -2 <= y <= BILD_H[0] + 2, f"{was}: y = {y} liegt außerhalb von 0..{BILD_H[0]}"


def txt(x, y, inhalt, farbe=SCHWARZ, groesse=7.0, gewicht=400, anker="middle", halo=False):
    """Ein Textstück. Die geschätzte Breite wird gegen den Rand geprüft, damit
    keine Beschriftung stumm über die Zeichenfläche hinausläuft."""
    breite = len(str(inhalt)) * groesse * 0.56
    links = x - (breite / 2 if anker == "middle" else breite if anker == "end" else 0)
    pruefe_im_bild(links, y, f"Text '{inhalt}' (links)")
    pruefe_im_bild(links + breite, y, f"Text '{inhalt}' (rechts)")
    schutz = ' paint-order="stroke" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"' if halo else ""
    return (f'<text x="{f(x)}" y="{f(y)}" fill="{farbe}" font-size="{f(groesse)}" '
            f'font-weight="{gewicht}" text-anchor="{anker}" '
            f'font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif"{schutz}>{inhalt}</text>')


def lin(p1, p2, farbe=SCHWARZ, breite=1.0, strich=None):
    for p in (p1, p2):
        pruefe_im_bild(p[0], p[1], "Linie")
    d = f' stroke-dasharray="{strich}"' if strich else ""
    return (f'<line x1="{f(p1[0])}" y1="{f(p1[1])}" x2="{f(p2[0])}" y2="{f(p2[1])}" '
            f'stroke="{farbe}" stroke-width="{f(breite)}" stroke-linecap="round"{d}/>')


def rect(x, y, b, h, rand=SCHWARZ, fuell="none", strichbreite=1.0, deckung=1.0, radius=0):
    pruefe_im_bild(x, y, "Rechteck")
    pruefe_im_bild(x + b, y + h, "Rechteck")
    return (f'<rect x="{f(x)}" y="{f(y)}" width="{f(b)}" height="{f(h)}" rx="{f(radius)}" '
            f'fill="{fuell}" fill-opacity="{f(deckung)}" stroke="{rand}" stroke-width="{f(strichbreite)}"/>')


def kreis(m, r, rand=SCHWARZ, fuell="none", breite=1.0):
    pruefe_im_bild(m[0] - r, m[1] - r, "Kreis")
    pruefe_im_bild(m[0] + r, m[1] + r, "Kreis")
    return (f'<circle cx="{f(m[0])}" cy="{f(m[1])}" r="{f(r)}" fill="{fuell}" '
            f'stroke="{rand}" stroke-width="{f(breite)}"/>')


def bogen(m, r, von, bis, farbe, breite=1.4, gross=None, strich=None):
    """Ein Kreisbogen von Winkel `von` bis `bis` (Gradmaß, gegen den Uhrzeiger)."""
    import math
    x1 = m[0] + r * math.cos(math.radians(von))
    y1 = m[1] - r * math.sin(math.radians(von))
    x2 = m[0] + r * math.cos(math.radians(bis))
    y2 = m[1] - r * math.sin(math.radians(bis))
    pruefe_im_bild(x1, y1, "Bogen")
    pruefe_im_bild(x2, y2, "Bogen")
    g = (1 if abs(bis - von) > 180 else 0) if gross is None else gross
    d = f' stroke-dasharray="{strich}"' if strich else ""
    return (f'<path d="M {f(x1)} {f(y1)} A {f(r)} {f(r)} 0 {g} 0 {f(x2)} {f(y2)}" '
            f'fill="none" stroke="{farbe}" stroke-width="{f(breite)}"{d}/>')


def polyline(punkte, farbe, breite=1.6, strich=None):
    for p in punkte:
        pruefe_im_bild(p[0], p[1], "Linienzug")
    d = " ".join(f"{f(a)},{f(b)}" for a, b in punkte)
    s = f' stroke-dasharray="{strich}"' if strich else ""
    return (f'<polyline points="{d}" fill="none" stroke="{farbe}" stroke-width="{f(breite)}" '
            f'stroke-linecap="round" stroke-linejoin="round"{s}/>')


def svg(b, h, teile):
    return (f'<svg viewBox="0 0 {f(b)} {f(h)}" xmlns="http://www.w3.org/2000/svg" '
            f'width="100%" role="img">' + "".join(teile) + "</svg>")
