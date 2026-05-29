import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { choreService } from '../../services/choreService';

export const fetchChores = createAsyncThunk(
  'chores/fetchChores',
  async (params, { rejectWithValue }) => {
    try {
      const data = await choreService.getChores(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chores');
    }
  }
);

export const fetchChoreDetail = createAsyncThunk(
  'chores/fetchChoreDetail',
  async (choreId, { rejectWithValue }) => {
    try {
      const data = await choreService.getChore(choreId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chore');
    }
  }
);

export const addChore = createAsyncThunk(
  'chores/addChore',
  async (choreData, { rejectWithValue }) => {
    try {
      const data = await choreService.createChore(choreData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add chore');
    }
  }
);

export const completeChore = createAsyncThunk(
  'chores/completeChore',
  async (choreId, { rejectWithValue }) => {
    try {
      const data = await choreService.completeChore(choreId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete chore');
    }
  }
);

export const deleteChore = createAsyncThunk(
  'chores/deleteChore',
  async (choreId, { rejectWithValue }) => {
    try {
      await choreService.deleteChore(choreId);
      return choreId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete chore');
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'chores/fetchHistory',
  async (choreId, { rejectWithValue }) => {
    try {
      const data = await choreService.getHistory(choreId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
    }
  }
);

const choreSlice = createSlice({
  name: 'chores',
  initialState: {
    chores: [],
    selectedChore: null,
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateChoreFromSocket: (state, action) => {
      const index = state.chores.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.chores[index] = action.payload;
      }
    },
    clearChoreError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChores.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchChores.fulfilled, (state, action) => {
        state.chores = action.payload;
        state.loading = false;
      })
      .addCase(fetchChores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchChoreDetail.fulfilled, (state, action) => {
        state.selectedChore = action.payload;
      })
      .addCase(addChore.fulfilled, (state, action) => {
        state.chores.unshift(action.payload);
        state.loading = false;
      })
      .addCase(addChore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(completeChore.fulfilled, (state, action) => {
        const index = state.chores.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.chores[index] = action.payload;
        }
        if (state.selectedChore?.id === action.payload.id) {
          state.selectedChore = action.payload;
        }
      })
      .addCase(deleteChore.fulfilled, (state, action) => {
        state.chores = state.chores.filter(c => c.id !== action.payload);
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { updateChoreFromSocket, clearChoreError } = choreSlice.actions;

export const selectChores = (state) => state.chores.chores;
export const selectSelectedChore = (state) => state.chores.selectedChore;
export const selectChoreHistory = (state) => state.chores.history;
export const selectChoreLoading = (state) => state.chores.loading;

export default choreSlice.reducer;
