#!/usr/bin/env python3
"""Erzeugt die Figuren und Tabellen der Formelsammlung „Normalverteilung“ (MSS 13, Thema 6).

Jede Säule kommt aus der Formel von Bernoulli, jede Kurve aus φ, jeder Tabellenwert aus
Φ(z) = (1 + erf(z / √2)) / 2. Das Skript rechnet mit, was die Formelsammlung behauptet: Nach dem
Stauchen haben die Säulen zusammen die Fläche 1/σ, nach dem Strecken wieder 1; die Näherungen
liegen nahe am genauen Wert; die σ-Regeln stimmen; die Tabelle steigt und trifft bekannte Werte.
Stimmt etwas nicht, bricht es ab.

    python3 nv-svgs.py      schreibt nv-figuren.txt (eine Zeichnung oder Tabelle je Zeile)
"""
import math
import pathlib

from tf_kopf import (BLAU, GRUEN, ORANGE, ROT, VIOLETT, GRAU, SCHWARZ,
                     de, f, lin, rect, polyline, pruefe_im_bild, setze_flaeche, svg, txt)


def B(n, p, k):
    return math.comb(n, k) * p ** k * (1 - p) ** (n - k)


def phi(z):
    return math.exp(-z * z / 2) / math.sqrt(2 * math.pi)


def Phi(z):
    return (1 + math.erf(z / math.sqrt(2))) / 2


def gleich(x, soll, was, eps=1e-9):
    assert abs(x - soll) < eps, f"{was}: {x} statt {soll}"


def flaechenzug(punkte, farbe, deckung):
    for p in punkte:
        pruefe_im_bild(p[0], p[1], "Fläche")
    d = " ".join(f"{f(a)},{f(b)}" for a, b in punkte)
    return f'<polygon points="{d}" fill="{farbe}" fill-opacity="{f(deckung)}" stroke="none"/>'


class Rahmen:
    """Ein Zeichenfeld mit Weltkoordinaten; Säulen außerhalb werden weggelassen."""
    def __init__(self, x0, y0, b, h, xmin, xmax, ymax):
        self.x0, self.y0, self.b, self.h = x0, y0, b, h
        self.xmin, self.xmax, self.ymax = xmin, xmax, ymax

    def X(self, x):
        return self.x0 + (x - self.xmin) / (self.xmax - self.xmin) * self.b

    def Y(self, y):
        return self.y0 + self.h - y / self.ymax * self.h

    def achsen(self, xmarken, xname, yname=None, y_marken=()):
        t = [lin((self.x0, self.Y(0)), (self.x0 + self.b, self.Y(0)), SCHWARZ, 0.8)]
        if self.xmin < 0 < self.xmax:
            t.append(lin((self.X(0), self.y0), (self.X(0), self.Y(0)), SCHWARZ, 0.8))
        for x in xmarken:
            t.append(lin((self.X(x), self.Y(0)), (self.X(x), self.Y(0) + 2), SCHWARZ, 0.6))
            t.append(txt(self.X(x), self.Y(0) + 8.5, de(x, 0 if x == int(x) else 1), GRAU, 5.8))
        for y in y_marken:
            t.append(lin((self.x0, self.Y(y)), (self.x0 + self.b, self.Y(y)), "#d5dae0", 0.5))
            # Zwei Stellen, sobald der Wert sie braucht: 0,08 als „0,1“ wäre eine falsche Beschriftung.
            t.append(txt(self.x0 - 2, self.Y(y) + 2, de(y, 1 if abs(y * 10 - round(y * 10)) < 1e-9 else 2), GRAU, 5.6, 400, "end"))
        t.append(txt(self.x0 + self.b, self.Y(0) + 15, xname, GRAU, 6.0, 400, "end"))
        if yname:
            t.append(txt(self.x0 + 2, self.y0 - 2, yname, GRAU, 6.0, 400, "start"))
        return t

    def saeule(self, a, b, h, rand, fuell, deckung, strich=None):
        if a < self.xmin - 1e-9 or b > self.xmax + 1e-9:
            return ""
        r = rect(self.X(a), self.Y(h), self.X(b) - self.X(a), self.Y(0) - self.Y(h), rand, fuell, 0.5, deckung)
        return r.replace("/>", f' stroke-dasharray="{strich}"/>') if strich else r

    def kurve(self, fn, a, b, farbe, breite=1.3, schritte=160):
        return polyline([(self.X(a + (b - a) * i / schritte), self.Y(fn(a + (b - a) * i / schritte))) for i in range(schritte + 1)], farbe, breite)

    def flaeche(self, fn, a, b, farbe, deckung):
        pts = [(self.X(a), self.Y(0))] + [(self.X(a + (b - a) * i / 120), self.Y(fn(a + (b - a) * i / 120))) for i in range(121)] + [(self.X(b), self.Y(0))]
        return flaechenzug(pts, farbe, deckung)


# ---------- Figur 1: Standardisieren in drei Schritten (n = 40, p = 0,5) ----------

def fig_standardisieren():
    n, p, kb = 40, 0.5, 23
    mu, s = n * p, math.sqrt(n * p * (1 - p))
    B_, H_ = 600.0, 96.0
    setze_flaeche(B_, H_)
    t = []
    stufen = [
        ("Schritt 1: verschieben um μ", lambda k: (k - mu - 0.5, k - mu + 0.5, B(n, p, k)), lambda k: (k - 0.5, k + 0.5, B(n, p, k)), (-14.0, 34.0, 0.15), [-10, 0, 10, 20, 30]),
        ("Schritt 2: stauchen mit 1/σ", lambda k: ((k - mu - 0.5) / s, (k - mu + 0.5) / s, B(n, p, k)), lambda k: (k - mu - 0.5, k - mu + 0.5, B(n, p, k)), (-14.0, 14.0, 0.15), [-10, -5, 0, 5, 10]),
        ("Schritt 3: strecken mit σ", lambda k: ((k - mu - 0.5) / s, (k - mu + 0.5) / s, s * B(n, p, k)), lambda k: ((k - mu - 0.5) / s, (k - mu + 0.5) / s, B(n, p, k)), (-4.0, 4.0, 0.45), [-3, -2, -1, 0, 1, 2, 3]),
    ]
    flaechen = []
    for i, (titel, neu, alt, (xmin, xmax, ymax), marken) in enumerate(stufen):
        r = Rahmen(18 + i * 196.0, 16.0, 170.0, 62.0, xmin, xmax, ymax)
        summe = 0.0
        for k in range(n + 1):
            a, b, h = alt(k)
            t.append(r.saeule(a, b, h, GRAU, "none", 0.0, "1.6 1.2"))
        for k in range(n + 1):
            a, b, h = neu(k)
            summe += (b - a) * h
            farbe = GRUEN if k == kb else BLAU
            t.append(r.saeule(a, b, h, farbe, farbe, 0.45 if k == kb else 0.18))
        flaechen.append(summe)
        t += r.achsen(marken, "z" if i else "x")
        t.append(txt(r.x0 + r.b / 2, 9.0, titel, SCHWARZ, 6.8, 700))
        t.append(txt(r.x0 + r.b - 2, r.y0 + 8, f"Fläche {de(summe, 3)}", VIOLETT, 6.0, 700, "end"))
    gleich(flaechen[0], 1.0, "Standardisieren: Fläche nach Schritt 1", 1e-12)
    gleich(flaechen[1], 1 / s, "Standardisieren: Fläche nach Schritt 2 ist 1/σ", 1e-12)
    gleich(flaechen[2], 1.0, "Standardisieren: Fläche nach Schritt 3", 1e-12)
    return svg(B_, H_, t)


# ---------- Figur 2: die Glockenfunktion φ ----------

def fig_phi():
    B_, H_ = 300.0, 110.0
    setze_flaeche(B_, H_)
    r = Rahmen(28.0, 14.0, 260.0, 76.0, -4.0, 4.0, 0.45)
    t = r.achsen([-3, -2, -1, 0, 1, 2, 3], "z", "φ(z)", (0.1, 0.2, 0.3, 0.4))
    t.append(r.flaeche(phi, -4, 4, BLAU, 0.08))
    t.append(r.kurve(phi, -4, 4, BLAU, 1.5))
    # Wendestellen: f″ wechselt bei ±1 das Vorzeichen — gerechnet, nicht behauptet.
    f2 = lambda z: (z * z - 1) * phi(z)
    for z in (-1, 1):
        assert f2(z - 0.01) * f2(z + 0.01) < 0, "φ: keine Wendestelle bei ±1"
        t.append(f'<circle cx="{f(r.X(z))}" cy="{f(r.Y(phi(z)))}" r="2.2" fill="{VIOLETT}"/>')
    gleich(phi(0), 1 / math.sqrt(2 * math.pi), "φ(0)")
    t.append(f'<circle cx="{f(r.X(0))}" cy="{f(r.Y(phi(0)))}" r="2.2" fill="{VIOLETT}"/>')
    t.append(txt(r.X(0) + 5, r.Y(phi(0)) + 1, f"φ(0) ≈ {de(phi(0), 4)}", VIOLETT, 6.2, 700, "start"))
    t.append(txt(r.X(1) + 5, r.Y(phi(1)) - 3, "Wendestelle", VIOLETT, 6.0, 400, "start"))
    flaeche = sum((phi(-6 + 12 * i / 4000) + phi(-6 + 12 * (i + 1) / 4000)) / 2 * 12 / 4000 for i in range(4000))
    gleich(flaeche, 1.0, "φ: Fläche 1 (die Ausläufer jenseits von ±6 tragen 2 · 10⁻⁹)", 1e-7)
    t.append(txt(r.X(-2.6), r.Y(0.22), "Fläche 1", BLAU, 6.4, 700))
    return svg(B_, H_, t)


# ---------- Figur 3: lokale Näherung (n = 100, p = 0,5, k = 55) ----------

def fig_lokal():
    n, p, k = 100, 0.5, 55
    mu, s = n * p, math.sqrt(n * p * (1 - p))
    B_, H_ = 300.0, 104.0
    setze_flaeche(B_, H_)
    r = Rahmen(28.0, 12.0, 260.0, 70.0, 33.5, 66.5, 0.09)
    t = r.achsen([35, 40, 45, 50, 55, 60, 65], "k", "P(X = k)", (0.02, 0.04, 0.06, 0.08))
    for i in range(34, 67):
        farbe = GRUEN if i == k else GRAU
        t.append(r.saeule(i - 0.5, i + 0.5, B(n, p, i), farbe, farbe, 0.5 if i == k else 0.2))
    g = lambda x: phi((x - mu) / s) / s
    t.append(r.kurve(g, 33.5, 66.5, BLAU, 1.4))
    nae, genau = g(k), B(n, p, k)
    assert abs(nae - genau) < 0.0005, "lokale Näherung: zu weit vom genauen Wert"
    t.append(f'<circle cx="{f(r.X(k))}" cy="{f(r.Y(nae))}" r="2.2" fill="{GRUEN}"/>')
    t.append(txt(r.X(k) + 5, r.Y(nae) - 6, f"(1/5) · φ(1) ≈ {de(nae, 4)}", GRUEN, 6.2, 700, "start"))
    t.append(txt(r.X(k) + 5, r.Y(nae) + 3, f"genau {de(genau, 4)}", GRAU, 6.0, 400, "start"))
    return svg(B_, H_, t)


# ---------- Figur 4: globale Näherung — P(45 ≤ X ≤ 55) als Fläche ----------

def fig_global():
    n, p, a, b = 100, 0.5, 45, 55
    mu, s = n * p, math.sqrt(n * p * (1 - p))
    B_, H_ = 300.0, 104.0
    setze_flaeche(B_, H_)
    r = Rahmen(28.0, 12.0, 260.0, 70.0, -4.0, 4.0, 0.45)
    t = r.achsen([-3, -2, -1, 0, 1, 2, 3], "z", "σ · P(X = k), φ(z)", (0.1, 0.2, 0.3, 0.4))
    za, zb = (a - 0.5 - mu) / s, (b + 0.5 - mu) / s
    gleich(za, -1.1, "global: z_a")
    gleich(zb, 1.1, "global: z_b")
    t.append(r.flaeche(phi, za, zb, GRUEN, 0.25))
    for i in range(n + 1):
        z = (i - mu) / s
        farbe = GRUEN if a <= i <= b else GRAU
        t.append(r.saeule(z - 0.5 / s, z + 0.5 / s, s * B(n, p, i), farbe, "none", 0.0))
    t.append(r.kurve(phi, -4, 4, BLAU, 1.4))
    for z in (za, zb):
        t.append(lin((r.X(z), r.Y(0)), (r.X(z), r.Y(0.42)), GRUEN, 0.9, "2 1.4"))
    nae = Phi(zb) - Phi(za)
    genau = sum(B(n, p, i) for i in range(a, b + 1))
    assert abs(nae - genau) < 0.0005, "globale Näherung: zu weit vom genauen Wert"
    t.append(txt(r.X(zb) + 3, r.Y(0.40), "z = (55 + 0,5 − 50) : 5 = 1,1", GRUEN, 5.8, 700, "start"))
    t.append(txt(r.X(za) - 3, r.Y(0.40), "z = −1,1", GRUEN, 5.8, 700, "end"))
    t.append(txt(r.X(2.6), r.Y(0.25), f"≈ {de(nae, 4)}", GRUEN, 6.4, 700))
    t.append(txt(r.X(2.6), r.Y(0.19), f"genau {de(genau, 4)}", GRAU, 6.0))
    return svg(B_, H_, t)


# ---------- Figur 5: Normalverteilung und σ-Regeln ----------

def fig_sigma():
    B_, H_ = 300.0, 112.0
    setze_flaeche(B_, H_)
    r = Rahmen(14.0, 20.0, 276.0, 66.0, -3.6, 3.6, 0.42)
    t = r.achsen([], "x")
    for m, deckung in ((3, 0.06), (2, 0.1), (1, 0.16)):
        t.append(r.flaeche(phi, -m, m, ROT, deckung))
    t.append(r.kurve(phi, -3.6, 3.6, BLAU, 1.4))
    namen = {-3: "μ − 3σ", -2: "μ − 2σ", -1: "μ − σ", 0: "μ", 1: "μ + σ", 2: "μ + 2σ", 3: "μ + 3σ"}
    for x, name in namen.items():
        t.append(lin((r.X(x), r.Y(0)), (r.X(x), r.Y(0) + 2), SCHWARZ, 0.6))
        t.append(txt(r.X(x), r.Y(0) + 8.5, name, VIOLETT if x == 0 else GRAU, 5.8, 700 if x == 0 else 400))
    werte = {m: Phi(m) - Phi(-m) for m in (1, 2, 3)}
    for m, soll in ((1, 0.683), (2, 0.954), (3, 0.997)):
        gleich(round(werte[m], 3), soll, f"σ-Regel {m}")
    # Klammern über den Umgebungen, von innen nach außen gestaffelt.
    for i, m in enumerate((1, 2, 3)):
        y = 15.0 - i * 5.0
        t.append(lin((r.X(-m), y), (r.X(m), y), ROT, 0.7))
        t.append(lin((r.X(-m), y), (r.X(-m), y + 2), ROT, 0.7))
        t.append(lin((r.X(m), y), (r.X(m), y + 2), ROT, 0.7))
        t.append(txt(r.X(m) + 2, y + 2, f"{de(werte[m] * 100, 1)} %", ROT, 5.8, 700, "start"))
    return svg(B_, H_, t)


# ---------- Tabelle: Φ(z) für z = 0,00 … 3,09 ----------

def tabelle_phi():
    kopf = "<tr><th>z</th>" + "".join(f"<th>{i}</th>" for i in range(10)) + "</tr>"
    zeilen = []
    vorher = 0.0
    for z10 in range(0, 31):
        z0 = z10 / 10
        zellen = []
        for h in range(10):
            z = z0 + h / 100
            w = Phi(z)
            assert w >= vorher, "Φ-Tabelle: nicht steigend"
            vorher = w
            zellen.append(f"<td>{format(w, '.4f').replace('.', ',')}</td>")
        zeilen.append(f"<tr><th>{de(z0, 1)}</th>{''.join(zellen)}</tr>")
    gleich(round(Phi(1.96), 4), 0.975, "Φ(1,96)")
    gleich(round(Phi(1.0), 4), 0.8413, "Φ(1)")
    gleich(round(Phi(0.0), 4), 0.5, "Φ(0)")
    return '<table class="phi">' + kopf + "".join(zeilen) + "</table>"


# ---------- Tabelle: z zu vorgegebenem Φ(z) ----------

def tabelle_quantile():
    def inv(g):
        a, b = -8.0, 8.0
        for _ in range(80):
            m = (a + b) / 2
            if Phi(m) < g:
                a = m
            else:
                b = m
        return (a + b) / 2
    gammas = [0.8, 0.9, 0.95, 0.975, 0.99, 0.995]
    zs = [inv(g) for g in gammas]
    gleich(round(zs[2], 3), 1.645, "Quantil 0,95")
    gleich(round(zs[3], 2), 1.96, "Quantil 0,975")
    kopf = "<tr><th>Φ(z)</th>" + "".join(f"<td>{format(g, '.3f').rstrip('0').replace('.', ',')}</td>" for g in gammas) + "</tr>"
    zeile = "<tr><th>z</th>" + "".join(f"<td>{format(z, '.3f').replace('.', ',')}</td>" for z in zs) + "</tr>"
    symm = "<tr><th>μ ± z · σ enthält</th>" + "".join(f"<td>{de((2 * g - 1) * 100, 1)} %</td>" for g in gammas) + "</tr>"
    return '<table class="quantile">' + kopf + zeile + symm + "</table>"


FIGUREN = [fig_standardisieren, fig_phi, fig_lokal, fig_global, fig_sigma, tabelle_phi, tabelle_quantile]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "nv-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren und Tabellen geschrieben")
