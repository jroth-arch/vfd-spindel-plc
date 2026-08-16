# Ujeta vzdalenost testu

**Cil:** Merit ujetou vzdalenost uhliku po sberacim krouzku, zobrazit ji na S1 HOME a ukladat ji do CSV logu.

## Vstup a vypocet

- Servis na S7 zadava `DB_Config.PrumerKrouzku_mm` v rozsahu `1.0..500.0 mm`.
- PLC akumuluje `DB_LogRuntime.UjetaVzdalenost_km` pri kazdem cyklu OB30, pouze pri aktivnim testu a platnem prumeru krouzku.
- Pro OB30 s periodou jedna sekunda plati:

$$
\Delta s_{\mathrm{km}} = \frac{\mathrm{RPM} \cdot \pi \cdot D_{\mathrm{mm}}}{60\,000\,000}
$$

- Hodnota se vynuluje pri startu noveho testu a zustane zachovana po rucnim STOP nebo safety poruse.

## HMI a CSV

- S1 HOME prida read-only hodnotu `Ujeta vzdalenost` pod `Aktualni RPM`.
- S7 prida vstup `Prumer krouzku [mm]` do praveho panelu `NASTAVENI TESTU`.
- Kazdy trendovy zaznam CSV, vcetne finalniho zaznamu, obsahuje sloupec `UjetaVzdalenost_km`.

## Overeni

1. TIA Portal compile.
2. PLCSIM Advanced a WinCC: kontrola resetu pri AUTO, rustu pri platnem prumeru a zachovani po STOP/tripu.
3. Produkcni PLC: porovnat hodnotu s rucnim vypoctem z RPM, casu a nakonfigurovaneho prumeru; overit hodnotu v CSV.