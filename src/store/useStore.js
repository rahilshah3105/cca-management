import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveItemToDB, deleteItemFromDB, subscribeToCollection } from '../services/db';

const initialPlayers = [
  { id: '1', name: 'Rahil' },
  { id: '2', name: 'Devam' },
  { id: '3', name: 'Hardik' },
  { id: '4', name: 'Malav' },
  { id: '5', name: 'Kunal' },
  { id: '6', name: 'Jainam' },
];

export const useStore = create(
  persist(
    (set, get) => ({
      players: initialPlayers,
      funds: [],
      balls: [],
      matches: [],
      isAdmin: false,
      theme: 'dark',
      isFirebaseSynced: false,
      dialog: null, // { type: 'alert'|'confirm'|'prompt', message, onConfirm, onCancel, defaultValue }
      
      setDialog: (config) => set({ dialog: config }),
      closeDialog: () => set({ dialog: null }),
      
      // Actions
      login: (password) => {
        if (password === 'Admin@123') {
          set({ isAdmin: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAdmin: false }),

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),

      // Firebase Sync Initialization
      initFirebaseSync: () => {
        if (get().isFirebaseSynced) return;

        const safe = (fn) => { try { fn(); } catch(e) { console.warn('Firebase sync error:', e.message); } };

        safe(() => subscribeToCollection('players', (data) => {
          if (data.length > 0) set({ players: data });
        }));
        safe(() => subscribeToCollection('funds', (data) => { set({ funds: data }); }));
        safe(() => subscribeToCollection('balls', (data) => { set({ balls: data }); }));
        safe(() => subscribeToCollection('matches', (data) => { set({ matches: data }); }));

        set({ isFirebaseSynced: true });
      },

      // Fund Actions
      addFund: (fund) => {
        const fundDate = fund.date ? new Date(fund.date).toISOString() : new Date().toISOString();
        const newFund = { ...fund, id: crypto.randomUUID(), date: fundDate };
        set((state) => ({ funds: [newFund, ...state.funds] }));
        saveItemToDB('funds', newFund);
      },
      
      updateFund: (id, updatedData) => {
        set((state) => ({
          funds: state.funds.map(f => f.id === id ? { ...f, ...updatedData } : f)
        }));
        const updatedFund = get().funds.find(f => f.id === id);
        if (updatedFund) saveItemToDB('funds', updatedFund);
      },

      removeFund: (id) => {
        set((state) => ({ funds: state.funds.filter((f) => f.id !== id) }));
        deleteItemFromDB('funds', id);
      },
      
      // Ball Actions
      addBallRecord: (record) => {
        const newRecord = { ...record, id: crypto.randomUUID(), date: new Date().toISOString() };
        set((state) => ({ balls: [newRecord, ...state.balls] }));
        saveItemToDB('balls', newRecord);
      },

      updateBallRecord: (id, updatedData) => {
        set((state) => ({
          balls: state.balls.map(b => b.id === id ? { ...b, ...updatedData } : b)
        }));
        const updatedBall = get().balls.find(b => b.id === id);
        if (updatedBall) saveItemToDB('balls', updatedBall);
      },
      
      removeBallRecord: (id) => {
        set((state) => ({ balls: state.balls.filter((b) => b.id !== id) }));
        deleteItemFromDB('balls', id);
      },

      // Player Actions
      addPlayer: (player) => {
        const newPlayer = { ...player, id: crypto.randomUUID() };
        set((state) => ({ players: [...state.players, newPlayer] }));
        saveItemToDB('players', newPlayer);
        return newPlayer.id;
      },

      updatePlayer: (id, updatedData) => {
        set((state) => ({
          players: state.players.map(p => p.id === id ? { ...p, ...updatedData } : p)
        }));
        const updatedPlayer = get().players.find(p => p.id === id);
        if (updatedPlayer) saveItemToDB('players', updatedPlayer);
      },

      removePlayer: (id) => {
        set((state) => ({ players: state.players.filter(p => p.id !== id) }));
        deleteItemFromDB('players', id);
      },

      importData: (importedState) => {
        set({
          funds: importedState.funds || [],
          balls: importedState.balls || [],
          players: importedState.players || initialPlayers
        });
      },

      // Match Actions
      addMatch: (match) => {
        const newMatch = { ...match, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        set((state) => ({ matches: [newMatch, ...state.matches] }));
        saveItemToDB('matches', newMatch);
        return newMatch.id;
      },

      updateMatch: (id, updatedData) => {
        set((state) => ({
          matches: state.matches.map(m => m.id === id ? { ...m, ...updatedData } : m)
        }));
        const updated = get().matches.find(m => m.id === id);
        if (updated) saveItemToDB('matches', updated);
      },

      addBallToMatch: (matchId, inningsIndex, ball) => {
        set((state) => ({
          matches: state.matches.map(m => {
            if (m.id !== matchId) return m;
            const innings = m.innings.map((inn, i) => {
              if (i !== inningsIndex) return inn;
              return { ...inn, balls: [...inn.balls, ball] };
            });
            return { ...m, innings };
          })
        }));
        const updated = get().matches.find(m => m.id === matchId);
        if (updated) saveItemToDB('matches', updated);
      },

      removeLastBall: (matchId, inningsIndex) => {
        set((state) => ({
          matches: state.matches.map(m => {
            if (m.id !== matchId) return m;
            const innings = m.innings.map((inn, i) => {
              if (i !== inningsIndex) return inn;
              const balls = [...inn.balls];
              balls.pop();
              return { ...inn, balls };
            });
            return { ...m, innings };
          })
        }));
        const updated = get().matches.find(m => m.id === matchId);
        if (updated) saveItemToDB('matches', updated);
      },

      deleteMatch: (id) => {
        set((state) => ({ matches: state.matches.filter(m => m.id !== id) }));
        deleteItemFromDB('matches', id);
      },
      
    }),
    {
      name: 'cca-storage',
      partialize: (state) => ({
        players: state.players,
        funds: state.funds,
        balls: state.balls,
        matches: state.matches,
        theme: state.theme,
        isAdmin: state.isAdmin,
      }),
    }
  )
);

// --- Custom Dialog Helpers ---
export const showAlert = (message) => {
  return new Promise((resolve) => {
    useStore.getState().setDialog({
      type: 'alert',
      message,
      onConfirm: () => {
        useStore.getState().closeDialog();
        resolve();
      }
    });
  });
};

export const showConfirm = (message) => {
  return new Promise((resolve) => {
    useStore.getState().setDialog({
      type: 'confirm',
      message,
      onConfirm: () => {
        useStore.getState().closeDialog();
        resolve(true);
      },
      onCancel: () => {
        useStore.getState().closeDialog();
        resolve(false);
      }
    });
  });
};

export const showPrompt = (message, defaultValue = '') => {
  return new Promise((resolve) => {
    useStore.getState().setDialog({
      type: 'prompt',
      message,
      defaultValue,
      onConfirm: (val) => {
        useStore.getState().closeDialog();
        resolve(val);
      },
      onCancel: () => {
        useStore.getState().closeDialog();
        resolve(null);
      }
    });
  });
};
