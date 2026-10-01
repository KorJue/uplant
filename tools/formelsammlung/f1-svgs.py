#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Folgen und Reihen“ (MSS 11, Analysis, Thema 1).

Jeder Punkt, jede Säule und jedes Feld wird aus der Folge gerechnet. Das Skript prüft dabei mit:
n₀ zum ε-Streifen ist wirklich das erste Glied im Streifen, die gedrehte Treppe füllt genau das
Rechteck, beim Verschiebetrick bleiben genau a₁ und a₁qⁿ übrig, und die Halbierungsfiguren füllen
das Quadrat bis auf das letzte Stück.

    python3 f1-svgs.py      schreibt f1-figuren.txt (eine Figur je Zeile)
"""
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ, GITTER,
                     de, f, kreis, lin, polyline, rect, setze_flaeche, svg, txt)


def zahl(x, stellen=3):
    s = de(round(x, stellen), stellen)
    if "," in s:
        s = s.rstrip("0").rstrip(",")
    return s


def bogen_pfeil(p1, p2, farbe, hoehe=6.0):
    """Ein Bogen über zwei Punkten — kein gerader Strich, denn zwischen n und n + 1 gibt es kein
    Folgenglied; eine Linie würde Werte behaupten, die es nicht gibt."""
    from tf_kopf import pruefe_im_bild
    mx, my = (p1[0] + p2[0]) / 2, min(p1[1], p2[1]) - hoehe
    for x, y in (p1, p2, (mx, my)):
        pruefe_im_bild(x, y, "Bogenpfeil")
    return (f'<path d="M {f(p1[0])} {f(p1[1])} Q {f(mx)} {f(my)} {f(p2[0])} {f(p2[1])}" fill="none" '
            f'stroke="{farbe}" stroke-width="0.8"/>'), (mx, my)


def punktgraph(B_, H_, werte, ymin, ymax, dy, farbe_von, *, titel=None, extra=None, titel_links=False):
    """Punkte (n | aₙ) mit Gitter; liefert auch die Abbildungen X, Y für Zusätze."""
    setze_flaeche(B_, H_)
    links, rechts, oben, unten = 24.0, 8.0, 14.0, 16.0
    n = len(werte)
    X = lambda k: links + (k / (n + 0.6)) * (B_ - links - rechts)
    Y = lambda y: H_ - unten - (y - ymin) / (ymax - ymin) * (H_ - oben - unten)
    t = []
    y = ymin
    while y <= ymax + 1e-9:
        t.append(lin((links, Y(y)), (B_ - rechts, Y(y)), GITTER, 0.5))
        t.append(txt(links - 3, Y(y) + 2.2, zahl(y, 1), GRAU, 5.8, 400, "end"))
        y += dy
    achse = 0 if ymin <= 0 <= ymax else ymin
    t.append(lin((links, Y(achse)), (B_ - rechts, Y(achse)), SCHWARZ, 0.8))
    t.append(lin((links, oben - 4), (links, H_ - unten), SCHWARZ, 0.8))
    for k in range(1, n + 1):
        if n <= 12 or k % 5 == 0:
            t.append(txt(X(k), H_ - unten + 8, str(k), GRAU, 5.8))
    if extra:
        t += extra(X, Y)
    for k, w in enumerate(werte, start=1):
        t.append(kreis((X(k), Y(w)), 1.9, farbe_von(k), farbe_von(k), 0.6))
    if titel:
        # Steigende Folgen tragen den Titel links — rechts oben liegen dort die letzten Punkte.
        if titel_links:
            t.append(txt(links + 6, oben - 4, titel, SCHWARZ, 6.4, 700, "start"))
        else:
            t.append(txt(B_ - rechts, oben - 4, titel, SCHWARZ, 6.4, 700, "end"))
    t.append(txt(B_ - rechts, H_ - 2, "n", GRAU, 6.0, 400, "end"))
    return t


# ---------- Figur 1: arithmetische Folge mit den n − 1 Schritten ----------

def fig_arithmetisch():
    a1, d = 1.0, 1.5
    werte = [a1 + (k - 1) * d for k in range(1, 7)]

    def pfeile(X, Y):
        t = []
        for k in range(1, 6):
            p, (mx, my) = bogen_pfeil((X(k) + 1.5, Y(werte[k - 1]) - 2.5), (X(k + 1) - 1.5, Y(werte[k]) - 2.5), ORANGE, 7.0)
            t.append(p)
            t.append(txt(mx, my - 1.5, "+1,5", ORANGE, 5.2, 700))
        return t
    t = punktgraph(150.0, 92.0, werte, 0.0, 10.0, 2.0, lambda k: GRUEN if k == 6 else BLAU, titel="a₁ = 1, d = 1,5", extra=pfeile, titel_links=True)
    assert werte[5] == a1 + 5 * d == 8.5
    return svg(150.0, 92.0, t)


# ---------- Figur 2: geometrische Folge ----------

def fig_geometrisch():
    a1, q = 16.0, 0.5
    werte = [a1 * q ** (k - 1) for k in range(1, 7)]

    def pfeile(X, Y):
        t = []
        for k in range(1, 6):
            p, (mx, my) = bogen_pfeil((X(k) + 1.5, Y(werte[k - 1]) - 2.5), (X(k + 1) - 1.5, Y(werte[k]) - 2.5), ORANGE, 6.0)
            t.append(p)
            t.append(txt(mx + 1, my - 1.5, "·½", ORANGE, 5.2, 700, "start"))
        return t
    t = punktgraph(150.0, 92.0, werte, 0.0, 16.0, 4.0, lambda k: GRUEN if k == 6 else BLAU, titel="a₁ = 16, q = ½", extra=pfeile)
    assert werte[5] == 0.5
    return svg(150.0, 92.0, t)


# ---------- Figur 3: der ε-Streifen ----------

def fig_epsilon():
    eps, g = 0.2, 2.0
    werte = [2 + 1 / k for k in range(1, 21)]
    n0 = next(k for k in range(1, 100) if all(abs(2 + 1 / m - g) < eps for m in range(k, 400)))
    assert n0 == 6, "ε-Streifen: n₀ ist nicht 6"

    def streifen(X, Y):
        return [rect(X(0.4), Y(g + eps), X(20.6) - X(0.4), Y(g - eps) - Y(g + eps), VIOLETT, VIOLETT, 0.5, 0.1),
                lin((X(0.4), Y(g)), (X(20.6), Y(g)), VIOLETT, 1.0, "3 2"),
                txt(X(20.6), Y(g + eps) - 2, "g ± ε = 2 ± 0,2", VIOLETT, 5.8, 700, "end"),
                lin((X(n0), Y(g + eps) - 8), (X(n0), Y(g - eps) + 4), GRUEN, 0.8, "2 1.5"),
                txt(X(n0) + 2, Y(g + eps) - 9, "n₀ = 6", GRUEN, 6.0, 700, "start")]
    t = punktgraph(300.0, 104.0, werte, 1.5, 3.0, 0.5, lambda k: GRUEN if k >= n0 else ROT, titel="aₙ = 2 + 1/n, ε = 0,2", extra=streifen)
    return svg(300.0, 104.0, t)


# ---------- Figur 4: Gauß — zwei Treppen ergeben ein Rechteck ----------

def fig_gauss():
    a1, d, n = 1, 1, 5
    glied = lambda k: a1 + (k - 1) * d
    H = glied(1) + glied(n)
    B_, H_ = 150.0, 96.0
    setze_flaeche(B_, H_)
    s = 13.0
    x0, y0 = 14.0, 84.0
    t = []
    flaeche = 0
    for k in range(1, n + 1):
        t.append(rect(x0 + (k - 1) * s, y0 - glied(k) * s, s, glied(k) * s, BLAU, BLAU, 0.6, 0.35))
        # Die gedrehte Kopie: Säule k landet über Säule n + 1 − k, von a_(n+1−k) bis H.
        unten = glied(n + 1 - k)
        t.append(rect(x0 + (n - k) * s, y0 - H * s, s, (H - unten) * s, ORANGE, ORANGE, 0.6, 0.35))
        flaeche += glied(k) + (H - unten)
    assert flaeche == n * H, "Gauß: die beiden Treppen füllen das Rechteck nicht"
    t.append(rect(x0, y0 - H * s, n * s, H * s, GRUEN, "none", 1.2))
    for k in range(1, n + 1):
        t.append(txt(x0 + (k - 0.5) * s, y0 - glied(k) * s / 2 + 2.2, str(glied(k)), BLAU, 6.0, 700))
    t.append(txt(x0 + n * s + 4, y0 - H * s / 2, f"a₁ + a₅ = {H}", GRUEN, 6.2, 700, "start"))
    t.append(txt(x0 + n * s + 4, y0 - H * s / 2 + 9, f"2 · s₅ = 5 · {H} = {n * H}", GRUEN, 6.2, 700, "start"))
    t.append(txt(x0 + n * s / 2, y0 + 9, "n = 5", GRAU, 6.0))
    return svg(B_, H_, t)


# ---------- Figur 5: der Verschiebetrick ----------

def fig_verschieben():
    a1, q, n = 3, 2, 4
    B_, H_ = 150.0, 70.0
    setze_flaeche(B_, H_)
    t = []
    fb, fh, x0 = 19.0, 11.0, 34.0
    oben = [a1 * q ** k for k in range(n)]
    unten = [a1 * q ** (k + 1) for k in range(n)]
    for k, w in enumerate(oben):
        weg = k > 0
        t.append(rect(x0 + k * 22, 8, fb, fh, BLAU, "#e7eaee" if weg else "none", 0.8 if weg else 1.4, 1.0, 2))
        t.append(txt(x0 + k * 22 + fb / 2, 15.8, str(w), GRAU if weg else SCHWARZ, 6.4, 700))
    for k, w in enumerate(unten):
        weg = k < n - 1
        # Unter dem Zwilling: q · a₁q^k steht unter a₁q^(k+1), also im Feld k + 1.
        if weg:
            assert w == oben[k + 1], "Verschiebetrick: Zwilling stimmt nicht"
        t.append(rect(x0 + (k + 1) * 22, 30, fb, fh, ORANGE, "#e7eaee" if weg else "none", 0.8 if weg else 1.4, 1.0, 2))
        t.append(txt(x0 + (k + 1) * 22 + fb / 2, 37.8, str(w), GRAU if weg else SCHWARZ, 6.4, 700))
    t.append(txt(x0 - 3, 15.8, "s₄ =", SCHWARZ, 6.4, 700, "end"))
    t.append(txt(x0 - 3, 37.8, "q · s₄ =", SCHWARZ, 6.4, 700, "end"))
    rest = oben[0] - unten[-1]
    s4 = sum(oben)
    assert rest == (1 - q) * s4, "Verschiebetrick: (1 − q) · s ≠ a₁ − a₁qⁿ"
    t.append(txt(B_ / 2, 52, f"s₄ − q · s₄ = {oben[0]} − {unten[-1]} = {de(rest)}", GRUEN, 6.0, 700))
    t.append(txt(B_ / 2, 61, f"s₄ = {de(rest)} : (1 − {q}) = {s4}", GRUEN, 6.0, 700))
    t.append(txt(B_ - 2, 68, "grau: hebt sich weg", GRAU, 5.2, 400, "end"))
    return svg(B_, H_, t)


# ---------- Figur 6: ½ + ¼ + ⅛ + … = 1 im Einheitsquadrat ----------

def fig_halbieren():
    B_, H_ = 150.0, 96.0
    setze_flaeche(B_, H_)
    s = 80.0
    x0, y0 = 8.0, 8.0
    x, y, w, h = x0, y0, s, s
    t = []
    summe = 0.0
    farben = [BLAU, GRUEN, ORANGE, VIOLETT]
    for k in range(1, 9):
        anteil = 0.5 ** k
        if k % 2 == 1:   # senkrecht teilen, linke Hälfte
            t.append(rect(x, y, w / 2, h, SCHWARZ, farben[(k - 1) % 4], 0.5, 0.35))
            if k <= 4:
                t.append(txt(x + w / 4, y + h / 2 + 2.4, f"1/{2 ** k}", SCHWARZ, 6.2 - 0.3 * k, 700))
            x += w / 2
            w /= 2
        else:            # waagerecht teilen, obere Hälfte
            t.append(rect(x, y, w, h / 2, SCHWARZ, farben[(k - 1) % 4], 0.5, 0.35))
            if k <= 4:
                t.append(txt(x + w / 2, y + h / 4 + 2.4, f"1/{2 ** k}", SCHWARZ, 6.2 - 0.3 * k, 700))
            y += h / 2
            h /= 2
        summe += anteil
    # Der Rest ist das letzte, nicht gefüllte Stück: 1 − s₈ = 1/256.
    assert abs((1 - summe) - (w * h) / (s * s)) < 1e-12, "Halbierungsfigur: Rest stimmt nicht"
    t.append(rect(x0, y0, s, s, SCHWARZ, "none", 1.0))
    t.append(txt(x0 + s + 5, 40, "½ + ¼ + ⅛ + …", SCHWARZ, 5.8, 700, "start"))
    t.append(txt(x0 + s + 5, 50, "= ½ : (1 − ½)", SCHWARZ, 5.8, 700, "start"))
    t.append(txt(x0 + s + 5, 60, "= 1", GRUEN, 6.8, 700, "start"))
    return svg(B_, H_, t)


FIGUREN = [fig_arithmetisch, fig_geometrisch, fig_epsilon, fig_gauss, fig_verschieben, fig_halbieren]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "f1-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
