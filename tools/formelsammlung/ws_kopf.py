"""Gemeinsame Zeichenbausteine der Formelsammlungen zur Wahrscheinlichkeitsrechnung (MSS 13, Themen 1–4).

Baum, Flächenmodell und Vierfeldertafel werden aus den Wahrscheinlichkeiten GERECHNET: Jede Figur
prüft, dass die Äste an jedem Knoten 1 ergeben und die Flächen das ganze Quadrat füllen. Eine
falsch abgeschriebene Zahl fiele sofort als Abbruch auf, nicht erst im Druck.
"""
from fractions import Fraction

from tf_kopf import (BLAU, GRUEN, ORANGE, GRAU, SCHWARZ, ROT, de, f, lin, rect, setze_flaeche, txt)


def P_(a, b):
    """P mit tiefgestellter Bedingung für SVG-Text: P_(„A“, „B“) ergibt P_A(B)."""
    return f'P<tspan baseline-shift="sub" font-size="5">{a}</tspan>({b})'


def zahl(x, stellen=4):
    """Wahrscheinlichkeit in deutscher Schreibweise ohne überflüssige Nullen."""
    if isinstance(x, Fraction):
        # Endliche Dezimalbrüche (Nenner nur aus 2 und 5) als Dezimalzahl: 12/125 = 0,096.
        n = x.denominator
        while n % 2 == 0:
            n //= 2
        while n % 5 == 0:
            n //= 5
        if n == 1:
            x = float(x)
            stellen = max(stellen, 6)
    if isinstance(x, Fraction):
        return f"{x.numerator}/{x.denominator}"
    s = de(round(x, stellen), stellen)
    if "," in s:
        s = s.rstrip("0").rstrip(",")
    return s


def baum(B_, H_, stufe1, stufe2, *, markiert=(), pfade=True, x0=14.0, dx=None, rand_oben=10.0, rand_unten=10.0, falsch=False):
    """Zweistufiger Baum von links nach rechts.

    stufe1 = [(name, p)], stufe2 = {name: [(name, p)]}; ein drittes Element ist die Beschriftung des
    Astes, etwa „3/9“ statt des gekürzten „1/3“ — beim Ziehen zählt man die Kugeln. Markierte Pfade (Paare von Namen) werden
    grün hervorgehoben; an den Blättern steht die Pfadwahrscheinlichkeit, gerechnet.

    falsch=True zeichnet einen absichtlich falschen Baum (eine Stolperstelle). Dann wird umgekehrt
    verlangt, dass mindestens ein Knoten NICHT 1 ergibt — sonst zeigte die Figur den Fehler nicht.
    """
    setze_flaeche(B_, H_)
    def aufteilen(ast):
        name, p = ast[0], ast[1]
        if len(ast) > 2:
            z, n = (int(v) for v in ast[2].split("/"))
            assert Fraction(z, n) == p, f"Baum: Beschriftung {ast[2]} passt nicht zu {p}"
        return name, p, (ast[2] if len(ast) > 2 else zahl(p))
    stufe1 = [aufteilen(a) for a in stufe1]
    stufe2 = {k: [aufteilen(a) for a in v] for k, v in stufe2.items()}
    summen = [sum(p for _, p, _ in stufe1)] + [sum(p for _, p, _ in a) for a in stufe2.values()]
    if falsch:
        assert any(abs(x - 1) > 1e-6 for x in summen), "Falscher Baum: alle Knoten ergeben 1 — der Fehler wäre nicht zu sehen"
    else:
        assert all(abs(x - 1) < 1e-12 for x in summen), f"Baum: ein Knoten ergibt nicht 1 ({summen})"
    dx = dx or (B_ - x0 - 96.0) / 2
    t = []
    blaetter = sum(len(stufe2[n]) for n, _, _ in stufe1)
    h = (H_ - rand_oben - rand_unten) / blaetter
    wurzel = (x0, H_ / 2)
    i = 0
    summe = 0.0
    for n1, p1, l1 in stufe1:
        aeste = stufe2[n1]
        y_mitte = rand_oben + h * (i + len(aeste) / 2)
        k1 = (x0 + dx, y_mitte)
        farbe1 = GRUEN if any(m[0] == n1 for m in markiert) else GRAU
        t.append(lin(wurzel, k1, farbe1, 1.1))
        oben = k1[1] < wurzel[1]
        t.append(txt((wurzel[0] + k1[0]) / 2, (wurzel[1] + k1[1]) / 2 + (-4 if oben else 9), l1, farbe1, 6.6, 700, halo=True))
        t.append(txt(k1[0] + 1, k1[1] + (-5 if oben else 10), n1, SCHWARZ, 6.8, 700, "middle"))
        for n2, p2, l2 in aeste:
            y = rand_oben + h * (i + 0.5)
            k2 = (x0 + 2 * dx, y)
            an = (n1, n2) in markiert
            farbe2 = GRUEN if an else GRAU
            t.append(lin(k1, k2, farbe2, 1.1))
            t.append(txt((k1[0] + k2[0]) / 2, (k1[1] + k2[1]) / 2 + (-3.5 if y < k1[1] else 8), l2, farbe2, 6.4, 700 if an else 400, halo=True))
            t.append(txt(k2[0] + 4, y + 2.4, n2, SCHWARZ, 6.8, 700, "start"))
            if pfade:
                t.append(txt(B_ - 4, y + 2.4, f"{l1} · {l2} = {zahl(p1 * p2)}", GRUEN if an else GRAU, 6.4, 700 if an else 400, "end"))
            summe += p1 * p2
            i += 1
        t.append(f'<circle cx="{f(k1[0])}" cy="{f(k1[1])}" r="1.7" fill="{SCHWARZ}"/>')
    t.append(f'<circle cx="{f(wurzel[0])}" cy="{f(wurzel[1])}" r="1.9" fill="{SCHWARZ}"/>')
    assert falsch or abs(summe - 1) < 1e-12, "Baum: die Pfade ergeben nicht 1"
    return t


def quadrat(B_, H_, a, x, y, *, spalten=("A", "Ā"), zeilen=("B", "B̄"), markiert=(), rahmen=None, x0=None, s=None, titel=None, farben=(GRUEN, ORANGE), rahmenfarbe=BLAU):
    """Flächenmodell: Spaltenbreite a (erste Stufe), in Spalte 1 unten die Höhe x, in Spalte 2 die
    Höhe y (zweite Stufe). markiert = Teilstücke ("AB", "AqB", …), die kräftig gefüllt werden;
    rahmen = Teilstücke, die als neue „Welt“ umrandet werden."""
    setze_flaeche(B_, H_)
    s = s or min(H_ - 26.0, B_ - 40.0)
    x0 = x0 if x0 is not None else (B_ - s) / 2 - 8
    y0 = 12.0 if titel else 6.0
    teile = {
        "AB": (x0, y0 + s * (1 - x), s * a, s * x, farben[0]),
        "ABq": (x0, y0, s * a, s * (1 - x), farben[0]),
        "AqB": (x0 + s * a, y0 + s * (1 - y), s * (1 - a), s * y, farben[1]),
        "AqBq": (x0 + s * a, y0, s * (1 - a), s * (1 - y), farben[1]),
    }
    flaeche = sum(b * h for _, _, b, h, _ in teile.values()) / (s * s)
    assert abs(flaeche - 1) < 1e-9, "Flächenmodell: die Teile füllen das Quadrat nicht"
    t = []
    for k, (xx, yy, b, h, farbe) in teile.items():
        if b > 1e-9 and h > 1e-9:
            t.append(rect(xx, yy, b, h, "none", farbe, 0, 0.55 if k in markiert else 0.14))
    t.append(lin((x0, y0 + s * (1 - x)), (x0 + s * a, y0 + s * (1 - x)), SCHWARZ, 0.8, "3 2"))
    t.append(lin((x0 + s * a, y0 + s * (1 - y)), (x0 + s, y0 + s * (1 - y)), SCHWARZ, 0.8, "3 2"))
    t.append(lin((x0 + s * a, y0), (x0 + s * a, y0 + s), SCHWARZ, 1.0))
    t.append(rect(x0, y0, s, s, SCHWARZ, "none", 1.1))
    for k in rahmen or ():
        xx, yy, b, h, _ = teile[k]
        t.append(rect(xx + 0.9, yy + 0.9, b - 1.8, h - 1.8, rahmenfarbe, "none", 1.8))
    t.append(txt(x0 + s * a / 2, y0 + s + 9, spalten[0], SCHWARZ, 6.8, 700))
    t.append(txt(x0 + s * a + s * (1 - a) / 2, y0 + s + 9, spalten[1], SCHWARZ, 6.8, 700))
    t.append(txt(x0 + s + 3, y0 + s - s * y / 2 + 2.4, zeilen[0], SCHWARZ, 6.8, 700, "start"))
    t.append(txt(x0 + s + 3, y0 + s * (1 - y) / 2 + 2.4, zeilen[1], SCHWARZ, 6.8, 700, "start"))
    if titel:
        t.append(txt(x0 + s / 2, 7.5, titel, SCHWARZ, 6.6, 700))
    return t


def tafel(zeilen, spalten, werte, *, fmt=zahl, hervor=()):
    """Vierfeldertafel als HTML-Tabelle in einer Zeile; die Summen werden gerechnet."""
    z = [sum(r) for r in werte]
    sp = [sum(werte[i][j] for i in range(2)) for j in range(2)]
    ges = sum(z)
    assert abs(sum(sp) - ges) < 1e-9, "Tafel: Zeilen- und Spaltensummen passen nicht zusammen"

    def zelle(i, j):
        k = ' class="b"' if (i, j) in hervor else ""
        return f"<td{k}>{fmt(werte[i][j])}</td>"
    kopf = "<tr><th></th>" + "".join(f"<th>{s}</th>" for s in spalten) + "<th>Σ</th></tr>"
    reihen = "".join(f"<tr><th>{zeilen[i]}</th>{zelle(i, 0)}{zelle(i, 1)}<td class=\"b\">{fmt(z[i])}</td></tr>" for i in range(2))
    fuss = f"<tr><th>Σ</th><td class=\"b\">{fmt(sp[0])}</td><td class=\"b\">{fmt(sp[1])}</td><td class=\"b\">{fmt(ges)}</td></tr>"
    return "<table>" + kopf + reihen + fuss + "</table>"


def balken(B_, y, teile, *, x0=10.0, hoehe=14.0):
    """Ein waagerechter Balken, dessen Teile sich wie die gegebenen Anteile verhalten."""
    gesamt = sum(w for w, _, _ in teile)
    t = []
    x = x0
    breite = B_ - 2 * x0
    for w, farbe, beschriftung in teile:
        b = breite * w / gesamt
        t.append(rect(x, y, b, hoehe, "none", farbe, 0, 0.55))
        x += b
    t.append(rect(x0, y, breite, hoehe, SCHWARZ, "none", 0.9))
    return t
