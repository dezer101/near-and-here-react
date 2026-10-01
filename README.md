# Near & Here

Near & Here is a responsive travel explorer I rebuilt as a portfolio project. I wanted one calm, useful place to look up a destination, see its local weather, get my bearings on a world map, and keep a shortlist of places I might visit.

This is a new React version of the idea from my university work. It is a portfolio rebuild, not a copy of the original assignment files.

## What it does

- Search for cities around the world and fly the map to the selected location.
- See current conditions and a five-day forecast, with Celsius and Fahrenheit controls.
- Read a short destination introduction sourced from Wikivoyage.
- Start a browser-only demo notebook and save places on that device.
- Ask a travel assistant for a food idea or a simple itinerary when its server is configured.
- Watch an openly licensed view of Athens, with its creator and license credited beside the video.
- Use the layout on a phone or desktop.

## Run it on your computer

You need Node.js 20.19 or newer, or Node.js 22.12 or newer.

1. Install the packages: `npm install`
2. Start the site and its small API server in one process: `npm run dev`
3. Open `http://127.0.0.1:3001`.

Destination search, weather, the map, destination notes, and the demo notebook work without service credentials. The optional travel assistant needs an OpenAI API key on the server.

## The demo notebook

The notebook is deliberately browser-only so someone can try the member-style feature without creating a real account or setting up a database. I store the display name and saved places in `localStorage` through `src/lib/demoNotebook.js`.

That means saved places stay in the same browser profile on the same device. They do not sync to another device or represent a private online account. Clearing the browser's site data removes them; the **Reset demo** button clears the notebook on purpose. The app does not collect an email address or password.

## Optional travel assistant setup

1. Copy `.env.example` to `.env.local`.
2. Add a server-side key to `OPENAI_API_KEY`. Choose a model available to the account in `OPENAI_MODEL` if the default is unavailable.

The key is read only by `server/index.js`; it is not prefixed with `VITE_` and is never sent to the browser. The Express endpoint checks the message shape and length, limits requests by IP, and asks the API not to store the response. The app itself does not save chat history. When a visitor sends a message, their message and selected city are sent to the AI service; the chat panel says this clearly.

The public demo includes destination search, weather, map animation, destination notes, video, and the browser-only notebook. The notebook saves only in each visitor's browser. The chat panel explains that live replies are unavailable in the static Pages build; no chat messages are sent from that version.

## How I organized the code

- `src/App.jsx` joins the main experience: destination search, weather, travel notes, the notebook, and the assistant. I kept the selected destination in one place so the map, forecast, travel note, and chat follow the same search.
- `src/components/TravelMap.jsx` keeps the map code separate. `FlyToPlace` watches for a selected location and calls Leaflet's `flyTo`, so a new search is visibly connected to the map movement.
- `src/lib/travelApi.js` groups the public travel requests. Keeping the fetch functions here avoids scattering endpoint details through the interface and gives each request a consistent error path.
- `src/lib/demoNotebook.js` reads and writes the clearly labeled, browser-only demo notebook.
- `server/index.js` keeps the AI key on the server. The browser calls `/api/chat`; it never gets the secret.
- `src/styles.css` contains the visual system and responsive layout. The restrained colors, serif headings, and map-like shapes give the travel journal its own character without making the information hard to scan.

### Why these choices

I used Open-Meteo for geocoding and weather so a visitor can search and check conditions without managing a weather account key. Leaflet gives the map an animated `flyTo` transition, and the OpenStreetMap attribution stays visible on the map. Wikivoyage adds a short, linked introduction to the place rather than another generic card. I used browser storage for the notebook because this is a portfolio demo, not a real account system. The chat request goes through a small Express server so a private API key cannot leak into the front end.


### What this project lets me demonstrate

- Building a responsive React interface and sharing selected state across independent sections.
- Connecting to public REST APIs and handling loading, missing results, and unit changes.
- Using a real map library and animating the map to coordinates returned by a search.
- Persisting a lightweight demo notebook in the browser while being clear that it is not authentication.
- Keeping a private API key on a server and putting basic request limits around a chat endpoint.
- Making design choices that keep the first view smaller by loading the interactive map when its section is needed.


## Data and media credits

- Weather and geocoding: [Open-Meteo](https://open-meteo.com/).
- Destination introduction: [Wikivoyage](https://www.wikivoyage.org/), with a link to the source page next to the summary.
- Map tiles: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright). This site uses the public tile service and displays its required attribution. The tile provider's usage policy applies.
- Video: [Acropolis.webm](https://commons.wikimedia.org/wiki/File:Acropolis.webm) by Yair-haklai, licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The credit appears beside the player. The video is loaded from Wikimedia Commons only when the visitor chooses to play it.
- Fonts: DM Sans and DM Serif Display, served by Google Fonts.

