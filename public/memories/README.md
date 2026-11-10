# Melbourne Dreamland — Real Memory Photographs Directory

Place real photographs of Adi and Damini (supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`) inside matching location folders under `/public/memories/`:

- `/public/memories/international-house/` — International House (Parkville)
- `/public/memories/11-inch-pizza/` — 11 Inch Pizza (Melbourne CBD)
- `/public/memories/bibi-ji/` — Bibi Ji (Melbourne CBD)
- `/public/memories/botanic-gardens/` — Royal Botanic Gardens (Adi's Birthday)
- `/public/memories/the-black-prince/` — The Black Prince (Melbourne CBD)
- `/public/memories/yarra-overlook/` — Final Romantic Destination (Southbank Overlook)

## How to Link Local Files in Config
Add the file path (for example `"/memories/international-house/first-week.jpg"`) and caption to `PHOTO_MEMORY_CONFIG` inside `/src/game/config/photosConfig.ts`.

## In-Game Browser Photo Upload (Persisted Locally)
You can also add or drag-and-drop real `.jpg`, `.jpeg`, `.png`, or `.webp` photographs directly inside any Scrapbook Memory screen or the Memory Journal while playing! Uploaded photos and custom captions are stored locally in IndexedDB so they persist across page refreshes without ever altering or replacing your photographs.
