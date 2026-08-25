Verarbeite den handover/-Ordner:
1. handover/ rekursiv scannen; *.zip zuerst in-place entpacken.
2. Neustes MANIFEST.md gewinnt; Dateien daneben haben Vorrang.
3. Dateien gemäss MANIFEST-Routing (Datei → Ziel → Aktion) verschieben; bei REPLACE die base-SHA prüfen.
4. Ein HANDOVER.md neben dem MANIFEST wird als Auftrag ausgeführt.
5. handover/ wird NIE committet. Nach Verarbeitung: kurze Zusammenfassung, was wohin ging.
