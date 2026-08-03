import React, { useState } from 'react';
import { Share2, Users, Check } from 'lucide-react';
import { FamilyMember } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  activeTab: 'weekly' | 'catalog' | 'shopping' | 'stores';
  setActiveTab: (tab: 'weekly' | 'catalog' | 'shopping' | 'stores') => void;
  roomCode: string;
  onChangeRoom: (newCode: string) => void;
  userInfo: { userId: string; userName: string };
  onUpdateUserName: (name: string) => void;
  isConnected: boolean;
  activeUsers?: FamilyMember[];
  weeklyItemCount: number;
  remainingItemCount: number;
  onOpenShareModal: () => void;
  onOpenActivityModal: () => void;
}

const TABS = [
  { id: 'weekly', label: 'This week' },
  { id: 'shopping', label: 'In store' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'stores', label: 'Store layouts' },
] as const;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  roomCode,
  onChangeRoom,
  userInfo,
  onUpdateUserName,
  isConnected,
  activeUsers = [],
  weeklyItemCount,
  remainingItemCount,
  onOpenShareModal,
  onOpenActivityModal,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userInfo.userName);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [tempRoom, setTempRoom] = useState(roomCode);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateUserName(tempName.trim());
      setIsEditingName(false);
    }
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempRoom.trim()) {
      onChangeRoom(tempRoom.trim());
      setIsEditingRoom(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-veil backdrop-blur-md shadow-sticky">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          {/* Wordmark and room. Type only — the name is the mark. */}
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="sign text-h2 text-ink shrink-0">Family list</span>

            {isEditingRoom ? (
              <form onSubmit={handleSaveRoom} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempRoom}
                  onChange={(e) => setTempRoom(e.target.value.toUpperCase())}
                  className="field font-mono w-28 py-1"
                  aria-label="Room code"
                  autoFocus
                />
                <button type="submit" className="btn btn-action py-1">
                  Join
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingRoom(true)}
                className="font-mono text-data text-ink-2 hover:text-ink truncate decoration-dotted underline underline-offset-4 decoration-edge-strong"
                title="Switch to another room code"
              >
                {roomCode}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Connection state is shape, not colour: filled dot is live, hollow
                and pulsing is still connecting. */}
            <span className="hidden sm:flex items-center gap-1.5 mr-1" aria-live="polite">
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-ink' : 'border border-ink-3 animate-pulse'
                }`}
              />
              <span className="eyebrow">{isConnected ? 'Live' : 'Connecting'}</span>
            </span>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="field w-28 py-1"
                  aria-label="Your display name"
                  autoFocus
                />
                <button type="submit" className="btn btn-action py-1" aria-label="Save name">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="btn btn-bare text-sm font-medium max-w-32 truncate"
                title="Change your display name"
              >
                {userInfo.userName}
              </button>
            )}

            {/* Presence and history. Monograms are neutral so the palette stays
                reserved for wayfinding. */}
            <button
              onClick={onOpenActivityModal}
              className="btn btn-bare gap-1.5"
              aria-label={`${activeUsers.length} here now. Open activity`}
              title="Who's here, and what changed"
            >
              {activeUsers.length > 0 ? (
                <span className="flex -space-x-1.5" aria-hidden="true">
                  {activeUsers.slice(0, 3).map((u) => (
                    <span
                      key={u.id}
                      className="w-6 h-6 rounded-full bg-surface-sunk border border-surface text-ink-2 text-[10px] font-semibold flex items-center justify-center"
                    >
                      {u.name.substring(0, 2).toUpperCase()}
                    </span>
                  ))}
                </span>
              ) : (
                <Users className="w-4 h-4" />
              )}
            </button>

            <ThemeToggle />

            <button onClick={onOpenShareModal} className="btn btn-action">
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Tabs use the same wide caps as the aisle signs: navigating the app
            and navigating the shop should sound alike. */}
        <nav className="flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar -mb-px" aria-label="Views">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'weekly' ? remainingItemCount : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`sign text-label whitespace-nowrap py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'border-ink text-ink'
                    : 'border-transparent text-ink-3 hover:text-ink-2'
                }`}
              >
                {tab.label}
                {tab.id === 'weekly' && weeklyItemCount > 0 && (
                  <span className="font-mono text-[10px] font-normal tracking-normal normal-case text-ink-3">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
