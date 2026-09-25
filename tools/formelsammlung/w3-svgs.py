#!/usr/bin/env python3
"""Erzeugt die Figuren der Formelsammlung „Baumdiagramme umdrehen“.

Der Schnelltest der Lernseite (Prävalenz 10 %, Sensitivität 96 %, Spezifität 99 %) wird einmal
vorwärts und einmal umgedreht gerechnet; beide Bäume, die Tafel und das Flächenmodell mit Lupe
entstehen aus denselben drei Zahlen.

    python3 w3-svgs.py      schreibt w3-figuren.txt (eine Figur je Zeile)
"""
import pathlib
from fractions import Fraction as Q

from tf_kopf import GRUEN, ORANGE, GRAU, SCHWARZ, de, setze_flaeche, svg, txt
from ws_kopf import balken, baum, quadrat, tafel, zahl

P, SE, SP = Q(10, 100), Q(96, 100), Q(99, 100)
TP, FN, FP, TN = P * SE, P * (1 - SE), (1 - P) * (1 - SP), (1 - P) * SP
POS = TP + FP
assert (TP, FP, POS) == (Q(96, 1000), Q(9, 1000), Q(105, 1000))


def prozent(x):
    return de(float(x) * 100, 1).replace(",0", "") + " %"


# ---------- Figur 1: der Baum, wie die Angaben ihn liefern ----------

def fig_vorwaerts():
    s1 = [("inf.", P), ("nicht inf.", 1 - P)]
    s2 = {"inf.": [("pos.", SE), ("neg.", 1 - SE)], "nicht inf.": [("pos.", 1 - SP), ("neg.", SP)]}
    return svg(250.0, 96.0, baum(250.0, 96.0, s1, s2, markiert={("inf.", "pos."), ("nicht inf.", "pos.")}))


# ---------- Figur 2: die Tafel ----------

def fig_tafel():
    return tafel(["infiziert", "nicht inf."], ["positiv", "negativ"], [[TP, FN], [FP, TN]], fmt=prozent, hervor={(0, 0), (1, 0)})


# ---------- Figur 3: der umgedrehte Baum ----------

def fig_umgedreht():
    neg = 1 - POS
    s1 = [("pos.", POS), ("neg.", neg)]
    s2 = {"pos.": [("inf.", TP / POS), ("nicht inf.", FP / POS)], "neg.": [("inf.", FN / neg), ("nicht inf.", TN / neg)]}
    # Die neuen Äste sind keine glatten Brüche (96/105 = 32/35); beschriftet wird auf vier Stellen.
    # Breiter als die anderen Bäume: „nicht inf.“ und die vierstelligen Pfade brauchen Platz.
    t = baum(320.0, 96.0, [(n, float(p)) for n, p in s1],
             {k: [(n, float(p)) for n, p in v] for k, v in s2.items()}, markiert={("pos.", "inf.")}, dx=78.0)
    return svg(320.0, 96.0, t)


# ---------- Figur 4: Flächenmodell mit Lupe, 10 % und 1 % ----------

def modell(p, titel):
    B_, H_ = 170.0, 176.0
    tp, fp = p * SE, (1 - p) * (1 - SP)
    t = quadrat(B_, 140.0, float(p), float(SE), float(1 - SP), spalten=("inf.", "nicht inf."), zeilen=("pos.", "neg."),
                markiert={"AB", "AqB"}, rahmen=(), titel=titel)
    setze_flaeche(B_, H_)
    s = 140.0 - 26.0
    x0 = (B_ - s) / 2 - 8
    t += balken(B_, 146.0, [(float(tp), GRUEN, ""), (float(fp), ORANGE, "")], x0=x0, hoehe=12.0)
    anteil = tp / (tp + fp)
    t.append(txt(x0, 170.0, f"Lupe: richtig positiv {prozent(anteil)}", GRUEN, 6.4, 700, "start"))
    return svg(B_, H_, t), anteil


def fig_modell_10():
    s, anteil = modell(P, "Prävalenz 10 %")
    assert abs(float(anteil) - 0.9143) < 1e-4
    return s


def fig_modell_1():
    s, anteil = modell(Q(1, 100), "Prävalenz 1 %")
    assert abs(float(anteil) - 0.4923) < 1e-4
    return s


FIGUREN = [fig_vorwaerts, fig_tafel, fig_umgedreht, fig_modell_10, fig_modell_1]

if __name__ == "__main__":
    zeilen = [fn() for fn in FIGUREN]
    pfad = pathlib.Path(__file__).parent / "w3-figuren.txt"
    pfad.write_text("\n".join(zeilen) + "\n", encoding="utf-8")
    print(f"{len(zeilen)} Figuren geschrieben")
