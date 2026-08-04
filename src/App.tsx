import React, { useState, useEffect } from 'react';
import { useGroceryRoom } from './hooks/useGroceryRoom';
import { Navbar } from './components/Navbar';
import { WeeklyListView } from './components/WeeklyListView';
import { MasterCatalogView } from './components/MasterCatalogView';
import { ShoppingModeView } from './components/ShoppingModeView';
import { StoreLayoutManager } from './components/StoreLayoutManager';
import { ShareRoomModal, ActivityModal } from './components/Modals';

export default function App() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'catalog' | 'shopping' | 'stores'>('weekly');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    roomCode,
    changeRoom,
    userInfo,
    updateUserName,
    isConnected,
    householdState,
    lastActivityToast,
    toggleWeekly,
    updateQuantity,
    markBought,
    addItem,
    editItem,
    deleteItem,
    addAllFavorites,
    clearBought,
    resetWeeklyList,
    changeActiveStore,
    updateStoreLayout,
    createStoreLayout,
    deleteStoreLayout,
    createCategory,
    updateCategory,
  } = useGroceryRoom('FAMILY-LIST');

  // Trigger brief activity toast when family members update list
  useEffect(() => {
    if (lastActivityToast && lastActivityToast.message) {
      setToastMessage(lastActivityToast.message);
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastActivityToast]);

  const weeklyItemCount = householdState.items.filter((i) => i.inWeeklyList).length;
  const remainingItemCount = householdState.items.filter((i) => i.inWeeklyList && !i.isBought).length;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        roomCode={roomCode}
        onChangeRoom={changeRoom}
        userInfo={userInfo}
        onUpdateUserName={updateUserName}
        isConnected={isConnected}
        activeUsers={householdState.activeUsers}
        weeklyItemCount={weeklyItemCount}
        remainingItemCount={remainingItemCount}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenActivityModal={() => setIsActivityModalOpen(true)}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto sm:px-6 py-5 sm:py-7">
        {activeTab === 'weekly' && (
          <WeeklyListView
            items={householdState.items}
            stores={householdState.stores}
            categories={householdState.categories}
            activeStoreId={householdState.activeStoreId}
            onChangeActiveStore={changeActiveStore}
            onToggleWeekly={toggleWeekly}
            onUpdateQuantity={updateQuantity}
            onMarkBought={markBought}
            onAddItem={addItem}
            onEditItem={editItem}
            onDeleteItemGroup={deleteItem}
            onAddAllFavorites={addAllFavorites}
            onClearBought={clearBought}
            onResetWeeklyList={resetWeeklyList}
            onGoToShoppingMode={() => setActiveTab('shopping')}
            onGoToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingModeView
            items={householdState.items}
            stores={householdState.stores}
            categories={householdState.categories}
            activeStoreId={householdState.activeStoreId}
            onChangeActiveStore={changeActiveStore}
            onMarkBought={markBought}
            onClearBought={clearBought}
            onGoToWeeklyList={() => setActiveTab('weekly')}
          />
        )}

        {activeTab === 'catalog' && (
          <MasterCatalogView
            items={householdState.items}
            stores={householdState.stores}
            categories={householdState.categories}
            onToggleWeekly={toggleWeekly}
            onAddItem={addItem}
            onEditItem={editItem}
            onDeleteItem={deleteItem}
          />
        )}

        {activeTab === 'stores' && (
          <StoreLayoutManager
            stores={householdState.stores}
            categories={householdState.categories}
            activeStoreId={householdState.activeStoreId}
            onChangeActiveStore={changeActiveStore}
            onUpdateStoreLayout={updateStoreLayout}
            onCreateStoreLayout={createStoreLayout}
            onDeleteStoreLayout={deleteStoreLayout}
            onCreateCategory={createCategory}
            onUpdateCategory={updateCategory}
          />
        )}
      </main>

      {/* Someone else changed the list. Inverted ink so it reads as a system
          voice rather than another card. */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 flex justify-center sm:justify-end pointer-events-none"
      >
        {toastMessage && (
          <p className="bg-ink text-paper text-sm px-4 py-2.5 rounded-box shadow-float max-w-sm truncate">
            {toastMessage}
          </p>
        )}
      </div>

      {isShareModalOpen && (
        <ShareRoomModal
          roomCode={roomCode}
          onClose={() => setIsShareModalOpen(false)}
          activeUsers={householdState.activeUsers}
        />
      )}

      {isActivityModalOpen && (
        <ActivityModal
          activity={householdState.activity}
          onClose={() => setIsActivityModalOpen(false)}
        />
      )}
    </div>
  );
}
