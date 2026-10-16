// Alle zwanzig Fälle in der Reihenfolge der Reiter. Die Position eines Falls ist zugleich die
// Stelle seines Buchstabens im Lösungssatz — so lässt sich der Satz nur vollständig lesen, wenn
// die Fälle aus allen Kapiteln gelöst sind.

import { FAELLE_1 } from "./faelle-1.js?v=1";
import { FAELLE_2 } from "./faelle-2.js?v=1";
import { FAELLE_3 } from "./faelle-3.js?v=1";
import { FAELLE_4 } from "./faelle-4.js?v=1";
import { FAELLE_K } from "./faelle-k.js?v=1";

export const LOESUNGSSATZ = "ERST DENKEN, DANN TEILEN";
export const LOESUNGSWORT = LOESUNGSSATZ.replace(/[^A-Z]/g, "");

// Der mathematische Kern jedes Falls, für die Landkarte „Welche Kapitel stecken in welchem Fall?“.
const MATHE = {
  fruehstart: "geometrische Folge und Reihe, Zinseszins",
  koffein: "rekursive Folge, Grenzwert, unendliche geometrische Reihe",
  steuer: "Stetigkeit an Nahtstellen, Grenzwert für x → ∞",
  wanderung: "Zwischenwertsatz, Intervallhalbierung",
  abschnitt: "mittlere und momentane Änderungsrate, Hochpunkt von s′",
  kuppe: "Tangente durch einen äußeren Punkt, Steigung",
  laden: "Ableitung von e<sup>kt</sup>, Logarithmus, beschränktes Wachstum",
  tageslaenge: "Ableitung von sin mit Kettenregel, mittlere und momentane Rate",
  kaub: "Extrem- und Wendestellen, Randextrema, Newton-Verfahren",
  paket: "Extremwertproblem mit Nebenbedingung und Definitionsbereich",
  dosis: "Untersuchung von t · e<sup>−kt</sup>, Gleichungen numerisch lösen",
  geierlay: "gedämpfte Schwingung, Hüllkurve, Folge der Hochpunkte",
  balkon: "Energie als Integral, Fläche zwischen Graphen, Bilanz",
  notbremse: "Weg als Integral der Geschwindigkeit, abschnittsweise integrieren",
  becken: "Bestand aus einer e-Rate, Grenzwert des Integrals, größter Bestand",
  zwoelfter: "Integral von sin(mt), Zuwachs aus der Änderungsrate",
  song: "Hochpunkt, Folgengrenzwert, Stammfunktion per Ansatz, Integral bis ∞",
  radweg: "Steckbrief, Knickfreiheit, Wendestelle, Steigungswinkel, Schar, Fläche",
  eauto: "Integral einer e-Rate, Grenzwerte an den Rändern, Extremwertproblem",
  keeling: "Trend und Schwingung ableiten, Monotonie, Mittelwert als Integral, Differenzenfolge",
};

export const FAELLE = [...FAELLE_1, ...FAELLE_2, ...FAELLE_3, ...FAELLE_4, ...FAELLE_K];
FAELLE.forEach((f, i) => {
  f.position = i + 1;
  f.buchstabe = LOESUNGSWORT[i];
  f.mathe = MATHE[f.key];
  if (!f.kompetenzen) f.kompetenzen = [f.kapitel];
});
