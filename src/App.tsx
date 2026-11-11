/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdventureHUD } from './components/game/AdventureHUD';
import { ArcadeMinigameModal } from './components/game/ArcadeMinigameModal';
import { AskHerOutModal } from './components/game/AskHerOutModal';
import { DialogueOverlay } from './components/game/DialogueOverlay';
import { LivePhotoBoothModal } from './components/game/LivePhotoBoothModal';
import { MemoryJournalModal } from './components/game/MemoryJournalModal';
import { PhotoScrapbookModal } from './components/game/PhotoScrapbookModal';
import { TramSelectorModal } from './components/game/TramSelectorModal';
import { VinylTurntableModal } from './components/game/VinylTurntableModal';
import { WorldMapModal } from './components/game/WorldMapModal';
import { TrackStatusInfo } from './game/AudioManager';
import { PhotoStorage } from './game/PhotoStorage';
import { SaveManager } from './game/SaveManager';
import {
  GameSaveData,
  GameTelemetry,
  InteriorInteractablePrompt,
  MinigameId,
  PointOfInterest,
  StoredUploadedPhoto,
  VinylRecordTrack,
} from './game/types';
import { DistrictId, LightingPreset } from './world/types';
import { SceneTelemetry, WorldScene } from './world/WorldScene';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<WorldScene | null>(null);

  const [saveData, setSaveData] = useState<GameSaveData>(() =>
    SaveManager.load()
  );
  const saveRef = useRef<GameSaveData>(saveData);
  saveRef.current = saveData;

  const [uploadedPhotos, setUploadedPhotos] = useState<StoredUploadedPhoto[]>(
    []
  );

  const [activeDistrict, setActiveDistrict] = useState<DistrictId>('parkville');
  const [lightingPreset, setLightingPreset] =
    useState<LightingPreset>('golden-hour');
  const [gameTelemetry, setGameTelemetry] = useState<GameTelemetry | null>(
    null
  );
  const [portraits, setPortraits] = useState<{
    adi: string;
    damini: string;
    sunny: string;
  } | null>(null);

  // Active Interactive UI States
  const [dialogueSession, setDialogueSession] = useState<{
    poi: PointOfInterest;
    lineIndex: number;
  } | null>(null);
  const [scrapbookPOI, setScrapbookPOI] = useState<PointOfInterest | null>(
    null
  );
  const [tramOriginStopId, setTramOriginStopId] = useState<string | null>(null);
  const [turntableOpen, setTurntableOpen] = useState(false);
  const [activeMinigame, setActiveMinigame] = useState<MinigameId | null>(null);
  const [photoBoothOpen, setPhotoBoothOpen] = useState(false);
  const [worldMapOpen, setWorldMapOpen] = useState(false);
  const [askHerOutOpen, setAskHerOutOpen] = useState(false);
  const [trackStatus, setTrackStatus] = useState<TrackStatusInfo | null>(null);
  const [journalTab, setJournalTab] = useState<
    'chapters' | 'keepsakes' | 'gallery' | 'settings' | null
  >(null);

  const anyModalOpen = Boolean(
    dialogueSession ||
      scrapbookPOI ||
      tramOriginStopId ||
      turntableOpen ||
      activeMinigame ||
      journalTab ||
      photoBoothOpen ||
      worldMapOpen ||
      askHerOutOpen
  );

  // Load persisted real uploaded photographs from IndexedDB
  useEffect(() => {
    PhotoStorage.getAllPhotos().then(setUploadedPhotos);
  }, []);

  // Sync modal input-blocking & dialogue state to WorldScene without re-mounting WebGL
  useEffect(() => {
    worldRef.current?.setModalOpen(anyModalOpen, Boolean(dialogueSession));
  }, [anyModalOpen, dialogueSession]);

  useEffect(() => {
    worldRef.current?.syncCompletedMemories(saveData.completedMemoryIds);
  }, [saveData.completedMemoryIds]);

  const handleInteractInteriorAction = useCallback(
    (actionType: InteriorInteractablePrompt['actionType']) => {
      if (actionType === 'exit-interior') {
        worldRef.current?.actorSystem.exitInterior();
      } else if (actionType === 'turntable') {
        setTurntableOpen(true);
      } else if (actionType === 'minigame-memory') {
        setActiveMinigame('memory-match');
      } else if (actionType === 'minigame-cricket') {
        setActiveMinigame('cricket-challenge');
      } else if (actionType === 'minigame-claw') {
        setActiveMinigame('claw-machine');
      }
    },
    []
  );

  const handleInteractPOI = useCallback((poi: PointOfInterest) => {
    if (poi.category === 'tram-stop' && poi.tramStopId) {
      setTramOriginStopId(poi.tramStopId);
      return;
    }

    if (poi.category === 'photo-booth') {
      setPhotoBoothOpen(true);
      return;
    }

    if (poi.dialogue.length > 0) {
      setDialogueSession({ poi, lineIndex: 0 });
      worldRef.current?.audio.playDialogueBlip(poi.dialogue[0].speaker);
    } else if (poi.category === 'memory' || poi.category === 'final-memory') {
      const updated = SaveManager.markMemoryCompleted(
        saveRef.current,
        poi.id,
        poi.rewardCollectibleId
      );
      setSaveData(updated);
      setScrapbookPOI(poi);
    }
  }, []);

  const handlePetSunnyRecord = useCallback(() => {
    setSaveData((curr) => SaveManager.recordSunnyPet(curr));
  }, []);

  // Initialize Three.js Melbourne Dreamland WorldScene once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const initialSave = SaveManager.load();

    const sceneInstance = new WorldScene(
      container,
      {
        onTelemetry: (data: SceneTelemetry) => {
          setActiveDistrict(data.activeDistrict);
          setGameTelemetry(data.game);
        },
        onInteractPOI: (poi) => handleInteractPOI(poi),
        onInteractInterior: (act) => handleInteractInteriorAction(act),
        onPetSunny: () => handlePetSunnyRecord(),
      },
      initialSave.musicMuted,
      initialSave.activeVinylMood,
      initialSave.completedMemoryIds
    );

    worldRef.current = sceneInstance;
    setPortraits({
      adi: sceneInstance.actorSystem.portraits.adi.warm,
      damini: sceneInstance.actorSystem.portraits.damini.warm,
      sunny: sceneInstance.actorSystem.portraits.sunny.warm,
    });

    (
      window as unknown as {
        __MELBOURNE_DREAMLAND_SPRITE_API__?: ReturnType<
          WorldScene['getSpriteWorldAPI']
        >;
        __MELBOURNE_DREAMLAND_WORLD__?: WorldScene;
      }
    ).__MELBOURNE_DREAMLAND_SPRITE_API__ = sceneInstance.getSpriteWorldAPI();
    (
      window as unknown as {
        __MELBOURNE_DREAMLAND_WORLD__?: WorldScene;
      }
    ).__MELBOURNE_DREAMLAND_WORLD__ = sceneInstance;

    const unsubAudio = sceneInstance.audio.subscribeStatus(setTrackStatus);

    return () => {
      unsubAudio();
      sceneInstance.dispose();
      worldRef.current = null;
    };
  }, [handleInteractInteriorAction, handleInteractPOI, handlePetSunnyRecord]);

  // Global Keyboard Shortcuts: M (Music Mute), N (Next Track), J (Journal), I (Keepsakes), Esc (Exit Interior / Pause Menu)
  const handleToggleMute = useCallback(() => {
    const world = worldRef.current;
    if (!world) return;
    const nextMuted = world.audio.toggleMute();
    setSaveData((curr) => SaveManager.save({ ...curr, musicMuted: nextMuted }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const k = e.key.toLowerCase();

      if (k === 'm' && !e.repeat) {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (k === 'n' && !e.repeat) {
        e.preventDefault();
        worldRef.current?.audio.nextTrack();
        return;
      }

      if (k === 'j' && !e.repeat && !dialogueSession && !scrapbookPOI) {
        e.preventDefault();
        setJournalTab((prev) => (prev === 'chapters' ? null : 'chapters'));
        return;
      }

      if (k === 'i' && !e.repeat && !dialogueSession && !scrapbookPOI) {
        e.preventDefault();
        setJournalTab((prev) => (prev === 'keepsakes' ? null : 'keepsakes'));
        return;
      }

      if (e.key === 'Escape' && !anyModalOpen) {
        e.preventDefault();
        if (worldRef.current?.actorSystem.activeInterior) {
          worldRef.current.actorSystem.exitInterior();
        } else {
          setJournalTab('settings');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModalOpen, dialogueSession, handleToggleMute, scrapbookPOI]);

  // Dialogue progression -> Opens Scrapbook Photo Memory Screen on completion
  const handleAdvanceDialogue = useCallback(() => {
    setDialogueSession((curr) => {
      if (!curr) return null;
      const nextIdx = curr.lineIndex + 1;
      if (nextIdx < curr.poi.dialogue.length) {
        worldRef.current?.audio.playDialogueBlip(
          curr.poi.dialogue[nextIdx].speaker
        );
        return { ...curr, lineIndex: nextIdx };
      }

      // Finished conversation: if at Yarra Overlook, launch the grand proposal!
      if (curr.poi.id === 'yarra-overlook') {
        setAskHerOutOpen(true);
      } else if (
        curr.poi.category === 'memory' ||
        curr.poi.category === 'final-memory'
      ) {
        setSaveData((prev) =>
          SaveManager.markMemoryCompleted(
            prev,
            curr.poi.id,
            curr.poi.rewardCollectibleId
          )
        );
        setScrapbookPOI(curr.poi);
      }
      return null;
    });
  }, []);

  // Real Photo Upload / Edit / Delete Handlers (Persisted in IndexedDB)
  const handleUploadFiles = useCallback(
    async (locationId: string, files: FileList, defaultCaption: string) => {
      const added: StoredUploadedPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const saved = await PhotoStorage.addUploadedFile(
          locationId,
          files[i],
          defaultCaption
        );
        if (saved) added.push(saved);
      }
      if (added.length > 0) {
        const refreshed = await PhotoStorage.getAllPhotos();
        setUploadedPhotos(refreshed);
      }
    },
    []
  );

  const handleUpdatePhotoCaption = useCallback(
    async (photoId: string, caption: string) => {
      await PhotoStorage.updateCaption(photoId, caption);
      const refreshed = await PhotoStorage.getAllPhotos();
      setUploadedPhotos(refreshed);
    },
    []
  );

  const handleDeletePhoto = useCallback(async (photoId: string) => {
    await PhotoStorage.deletePhoto(photoId);
    const refreshed = await PhotoStorage.getAllPhotos();
    setUploadedPhotos(refreshed);
  }, []);

  // Tram boarding handler
  const handleSelectTramDestination = useCallback(
    (destStopId: string) => {
      if (!tramOriginStopId) return;
      const origin = tramOriginStopId;
      setTramOriginStopId(null);
      worldRef.current?.actorSystem.startTramRide(origin, destStopId);
    },
    [tramOriginStopId]
  );

  // Vinyl Cafe record change handler
  const handleSelectVinylRecord = useCallback((record: VinylRecordTrack) => {
    worldRef.current?.audio.setMood(record.moodId);
    setSaveData((curr) =>
      SaveManager.recordVinylPlayed(
        curr,
        record.id,
        record.moodId,
        record.rewardCollectibleId
      )
    );
  }, []);

  const handleRecordMinigameResult = useCallback(
    (gameId: MinigameId, score: number, rewardId?: string) => {
      setSaveData((curr) =>
        SaveManager.recordMinigameScore(curr, gameId, score, rewardId)
      );
    },
    []
  );

  const handleFastTravel = useCallback((poi: PointOfInterest) => {
    setWorldMapOpen(false);
    worldRef.current?.travelToPosition(
      poi.position[0],
      poi.position[2] + 2.0
    );
  }, []);

  const handleSelectDistrictView = useCallback((districtId: DistrictId) => {
    setWorldMapOpen(false);
    worldRef.current?.selectDistrict(districtId);
  }, []);

  const handleSavePhotoKeepsake = useCallback((entry: StoredUploadedPhoto) => {
    setUploadedPhotos((prev) => [...prev.filter((p) => p.id !== entry.id), entry]);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#181614]">
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Melbourne Dreamland 2.5D Relationship Adventure"
      />

      {/* Semantic Indie Adventure HUD Overlay */}
      <AdventureHUD
        activeDistrict={activeDistrict}
        lightingPreset={lightingPreset}
        game={gameTelemetry}
        saveData={saveData}
        portraits={portraits}
        anyModalOpen={anyModalOpen}
        trackStatus={trackStatus}
        onTriggerInteract={() =>
          worldRef.current?.actorSystem.triggerContextualInteraction()
        }
        onInteractInteriorAction={handleInteractInteriorAction}
        onOpenJournal={(tab) => setJournalTab(tab)}
        onOpenPhotoBooth={() => setPhotoBoothOpen(true)}
        onOpenMap={() => setWorldMapOpen(true)}
        onOpenPause={() => setJournalTab('settings')}
        onToggleMute={handleToggleMute}
        onTogglePlay={() => worldRef.current?.audio.togglePlayPause()}
        onNextTrack={() => worldRef.current?.audio.nextTrack()}
        onPrevTrack={() => worldRef.current?.audio.prevTrack()}
        onToggleShuffle={() => worldRef.current?.audio.toggleShuffle()}
        onSelectTrack={(idx) => worldRef.current?.audio.playTrack(idx)}
        onFocusCharacter={() => worldRef.current?.focusCharacter()}
        onSelectDistrict={(id) => worldRef.current?.selectDistrict(id)}
        onChangeLighting={(preset) => {
          setLightingPreset(preset);
          worldRef.current?.setLightingPreset(preset);
        }}
        onZoomStep={(factor) => worldRef.current?.zoomBy(factor)}
        onRotateStep={(dir) => worldRef.current?.rotateCameraStep(dir)}
        onExitInterior={() => worldRef.current?.actorSystem.exitInterior()}
      />

      {/* 1. Relationship Conversation Overlay */}
      {dialogueSession && (
        <DialogueOverlay
          poi={dialogueSession.poi}
          lineIndex={dialogueSession.lineIndex}
          portraits={portraits}
          onAdvance={handleAdvanceDialogue}
          onClose={() => setDialogueSession(null)}
        />
      )}

      {/* 2. Scrapbook Photo Memory Screen (Real Photographs) */}
      {scrapbookPOI && (
        <PhotoScrapbookModal
          poi={scrapbookPOI}
          uploadedPhotos={uploadedPhotos}
          onUploadFiles={handleUploadFiles}
          onUpdateCaption={handleUpdatePhotoCaption}
          onDeletePhoto={handleDeletePhoto}
          onClose={() => setScrapbookPOI(null)}
        />
      )}

      {/* 3. Melbourne Tram Destination Selector */}
      {tramOriginStopId && (
        <TramSelectorModal
          originStopId={tramOriginStopId}
          onSelectDestination={handleSelectTramDestination}
          onClose={() => setTramOriginStopId(null)}
        />
      )}

      {/* 4. Wax & Groove Vinyl Cafe Listening Booth */}
      {turntableOpen && (
        <VinylTurntableModal
          saveData={saveData}
          daminiPortrait={portraits?.damini}
          onSelectRecord={handleSelectVinylRecord}
          onToggleMute={handleToggleMute}
          onClose={() => setTurntableOpen(false)}
        />
      )}

      {/* 5. Starlight Arcade Playable Minigames (Memory Match, Cricket, Claw Machine) */}
      {activeMinigame && (
        <ArcadeMinigameModal
          activeGame={activeMinigame}
          saveData={saveData}
          uploadedPhotos={uploadedPhotos}
          audio={worldRef.current?.audio ?? null}
          onSwitchGame={setActiveMinigame}
          onRecordResult={handleRecordMinigameResult}
          onClose={() => setActiveMinigame(null)}
        />
      )}

      {/* 6. Memory Journal, Keepsakes Shelf & World Pause Settings */}
      {journalTab && (
        <MemoryJournalModal
          activeTab={journalTab}
          saveData={saveData}
          uploadedPhotos={uploadedPhotos}
          lightingPreset={lightingPreset}
          onChangeTab={setJournalTab}
          onRevisitMemory={(poi) => {
            setJournalTab(null);
            setScrapbookPOI(poi);
          }}
          onTravelNearPOI={(poi) => {
            setJournalTab(null);
            worldRef.current?.travelToPosition(
              poi.position[0],
              poi.position[2] + 2.2
            );
          }}
          onOpenPhotoBooth={() => setPhotoBoothOpen(true)}
          onUpdateCaption={handleUpdatePhotoCaption}
          onDeletePhoto={handleDeletePhoto}
          onChangeLighting={(preset) => {
            setLightingPreset(preset);
            worldRef.current?.setLightingPreset(preset);
          }}
          onToggleMute={handleToggleMute}
          onClose={() => setJournalTab(null)}
        />
      )}

      {/* 7. Live Vintage B&W Photo Booth */}
      {photoBoothOpen && (
        <LivePhotoBoothModal
          defaultPortraitUrl={portraits?.adi}
          onSaveKeepsake={handleSavePhotoKeepsake}
          onClose={() => setPhotoBoothOpen(false)}
        />
      )}

      {/* 8. Melbourne Dreamland World Map & Fast Travel */}
      {worldMapOpen && (
        <WorldMapModal
          activeDistrict={activeDistrict}
          saveData={saveData}
          onFastTravel={handleFastTravel}
          onSelectDistrictView={handleSelectDistrictView}
          onClose={() => setWorldMapOpen(false)}
        />
      )}

      {/* 9. The Proposal Climax: Ask Damini Out Under Melbourne Twilight */}
      {askHerOutOpen && (
        <AskHerOutModal
          saveData={saveData}
          portraits={portraits}
          onSuccess={(updatedSave, photoEntry) => {
            setSaveData(SaveManager.save(updatedSave));
            if (photoEntry) {
              setUploadedPhotos((prev) => [...prev, photoEntry]);
            }
          }}
          onOpenPhotoBooth={() => setPhotoBoothOpen(true)}
          onClose={() => setAskHerOutOpen(false)}
        />
      )}
    </main>
  );
}
