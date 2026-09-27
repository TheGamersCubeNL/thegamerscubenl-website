# MAX HITRADIO — Website v2.0

Bestemming: **https://thegamerscube.nl/max/**. Zet alle bestanden in de bestaande website-repository in een map `/max/`, zodat de oude `index.html` in de repositoryroot niet wordt vervangen. Pas bestaande root-Firebaseconfiguratie of -regels niet automatisch aan.

## Wat meteen werkt zonder Firebase
- CloudRadio-stream: `https://audio.cloudrad.io/ef465bb5/live` en automatische nummerinformatie via `https://public.cloudrad.io/ef465bb5/live/streaminfo.js`.
- Albumhoezen via de bestaande optionele iTunes-zoekfunctie in `js/player.js`.
- Lokale favorieten, recent afgespeelde nummers zolang een bezoeker deze website open heeft (bewaring in dezelfde browser), delen, en artiesteninfo via Wikipedia indien beschikbaar.
- Vaste speler, nieuwe navigatie, responsieve website, installatiebare PWA via manifest + service worker (vereist HTTPS; audio blijft online-only).
- Aangekondigde lege secties voor Top 40, DJ's, programmering, winacties, polls, speciale uitzendingen en nieuws; geen fictieve uitzendingen.
- Actuele CloudRadio-luisteraars in beeld, *als* `streaminfo.js` die doorgeeft. Geen historische statistiekdatabase.

## Firebase activeren
De interactieve functies voor meerdere bezoekers hebben een EIGEN Firebase-project nodig. Dit project is **niet** door deze oplevering geconfigureerd of live gezet.
1. Maak of kies je Firebase-project en activeer Authentication (E-mail/wachtwoord en eventueel Google), Firestore en, voor meldingen, Firebase Cloud Messaging.
2. Kopieer de web-app-configuratie vanuit de Firebase console in **`max/config.js`** bij `firebase`. Alleen je eigen web-app-config, **NOOIT** een service-accountkey of servergeheim! Stel ook Authentication > Settings > Authorized domains in (o.a. `thegamerscube.nl`).
3. Publiceer de bijgeleverde Firestore-regels uit `firebase/firestore.rules`. **LET OP:** als je bestaande TheGamersCubeNL-site dezelfde Firestore-database gebruikt, overschrijf de bestaande regels NIET; integreer ze zorgvuldig of gebruik voor MAX een apart Firebase-project.
4. Maak in de Firebase console na je eerste aanmelding **zelf handmatig** het document `roles/<jouw Firebase Auth UID>` met veld `role` (string) = `admin`. De browser kan deze rol niet aan zichzelf geven; Firestore-regels verhinderen dit.
5. Zet optioneel je Cloud Messaging Web Push VAPID-key in `config.js`. Publiceer voor webpush de serverfunctie `functions/index.js` naar je eigen Firebase-project; `firebase deploy --only functions` (mogelijk vereist dit een betaald Firebase-abonnement). Zonder functie kun je geen massale pushmelding versturen.
6. Zet anti-spammaatregelen aan (Firebase App Check voor web waar passend, monitoring, abuse-limieten via vertrouwde Cloud Functions en moderatie). Security rules beperken toegestane velden en toegang maar regelen geen harde per-minuut-chatlimiet en zijn geen vervanging voor een spamfilter.

## Adminpaneel
Na login met het in stap 4 toegekende adminaccount verschijnt **MAX Content Studio** onderaan de website. Dezelfde account kan actuele inzendingen en verzoeknummers bekijken. Content invoeren gebeurt als JSON met een voorbeeld dat automatisch verandert bij de keuze in het menu. Plaats het veld `published:true` pas wanneer het onderdeel compleet is.

- `top40`: 40 losse documenten `{ "rank":1,"artist":"Naam", "title":"Titel", "published":true }`.
- `news`: `{ "title":"Titel", "body":"Bericht", "date":"2026-11-01T10:00:00+01:00", "url":"https://...", "published":true }`.
- `djs`: `{ "name":"DJ naam", "bio":"...", "image":"https://...", "published":true }`.
- `programs`: `{ "title":"Programma", "day":"Maandag", "start":"10:00", "end":"12:00", "dj":"DJ", "sort":1, "published":true }`. Dit schema wordt voorlopig niet automatisch in het huidige programma omgezet; daarvoor is het document `station/current` de bron.
- `station` document-ID `current`: `{ "program":"Programma", "dj":"DJ" }`.
- `contests`: `{ "title":"Winactie", "description":"Voorwaarden: vermeld hier de volledige voorwaarden en privacyinformatie", "end":"2026-12-31T20:00:00+01:00", "published":true }`. Bij het bewaren voegt het beheerpaneel automatisch een Firestore-`endAt` toe; de beveiligingsregels blokkeren deelname na dat tijdstip. De website maakt geen automatische trekking, controleert geen wettelijke actievoorwaarden en verstuurt geen prijzen.
- `polls`: `{ "question":"Vraag", "options":["Antwoord A","Antwoord B"],"published":true }`; één stem per ingelogde account. Resultaattelling is niet publiek ingebouwd; stemdocumenten staan onder `polls/<id>/votes/` en alleen beheerders mogen deze lezen.
- `events`: `{ "title":"Speciale uitzending", "date":"2026-12-31T20:00:00+01:00", "description":"...", "published":true }`; countdown wordt op de browserklok berekend.

## Grenzen / privacy
- De browser is geen vertrouwde server. **Bescherm alle writes met Firestore-regels** en gebruik een aparte beheerdersrol. Het beheerpaneel is alleen zichtbaar voor het geverifieerde account.
- Chat is voor iedereen leesbaar, schrijven alleen na login; verzoeknummers en winactieantwoorden zijn alleen door beheerder leesbaar. Stel een privacyverklaring op voor accountgegevens, chat, verzoeken, winacties en push tokens. Je bent verantwoordelijk voor eventuele minimumleeftijd, bewaartermijnen en voorwaarden.
- Een individuele gebruiker kan lokaal favorieten opslaan zonder inloggen; na Firebase-login worden ze tevens opgeslagen en samengevoegd met favorieten van het account.
- Recent gedraaid is **beperkt tot je eigen browsersessie/historie sinds de website openstaat**; voor een volledig archief moet de echte CloudRadio-history API/provider worden gekoppeld.
- Artiestinfo is best-effort via Wikipedia en kan bij gelijknamige artiesten onjuist zijn. Klik de bron na om dit te controleren.
- Push is browser- en platformafhankelijk, heeft expliciete toestemming én Firebase-inrichting nodig. Je kunt zonder complete pushconfiguratie de site en PWA wel installeren.
- Luisterstatistieken tonen alleen het actuele aantal dat CloudRadio eventueel aan het script toevoegt; bezoekersaantallen, trendgrafieken, rapportages of serverlogs zijn NIET geïmplementeerd.
- Verzoeknummers worden aan de redactie verzonden, NIET automatisch in de uitzending geplaatst. Nieuws, Top 40, DJ's, programmering en winacties worden pas publiek wanneer je deze publiceert.
- De PWA-serviceworker slaat alleen statische sitebestanden op; het afspelen van liveaudio vereist internet. Via GitHub Pages blijft de website frontend-only, Firebase is de aparte backend.

## Testen
Serveer de map lokaal via `python -m http.server 8000` vanuit de repositoryroot en open `http://localhost:8000/max/` (of publiceer op HTTPS). Sommige functies, waaronder service worker en Google-login, vragen een geschikte lokale of HTTPS origin. Test op de echte domeinmap, desktop en mobiel. CloudRadio en externe diensten zijn afhankelijk van externe bereikbaarheid en toestemming.
