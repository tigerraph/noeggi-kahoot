# 2026-08-26 · Arcade-Modus, Antwort-Meldungen, Bonuspunkte

- Antwortkorrektur: `neighbor` ist Sidney, nicht Frank (aus der laufenden Runde gemeldet).
  `verify.js` prüft die Antwort jetzt in allen drei Sprachen, analog zu `conf1998`.
- Vergangene Scores lassen sich nicht nachrechnen — die `scores`-Tabelle hält nur Endsummen,
  keine Einzelantworten. Kompensation läuft deshalb über Bonuspunkte statt über eine Neuberechnung.
- Arcade-Modus (`👾23`): alle 23 Fragen, 5 Sekunden pro Frage, Auto-Weiter nach 3 Sekunden.
  Freischaltung über die vollständige Bonus-Galerie (alle 7 Fotos), nicht über eine Punktzahl —
  das belohnt Serien statt Spielzeit und ist ohne Cloud-Abgleich lokal prüfbar.
- Look: DOS/Pixel-Skin (`body.arcade`) als eigene Klasse, die den 80s-Skin während des Laufs
  verdrängt und danach zurückgibt. Der 🕹️-Toggle ist im Arcade-Lauf ausgeblendet.
- Meldungen landen in `feedback` (insert-only für anon — niemand liest fremde Meldungen im Client).
  Das Öffnen des Melde-Felds stoppt den Auto-Countdown, sonst tippt man gegen die Uhr.
- Bonuspunkte in `bonus` (read-only für anon), Vergabe von Hand. Der Client addiert sie auf den
  besten Lauf des Namens (case-insensitive) und markiert die Zeile mit `+1000`.
- `build.py` benutzte `datetime.UTC` (Python 3.11+); auf dem Mac gewinnt `/usr/bin/python3` 3.9.6
  im PATH und der Build brach ab. Jetzt `datetime.timezone.utc`.
