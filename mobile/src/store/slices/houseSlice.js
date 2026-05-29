import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { houseService } from '../../services/houseService';

export const fetchHouse = createAsyncThunk(
  'house/fetchHouse',
  async (_, { rejectWithValue }) => {
    try {
      const data = await houseService.getHouse();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch house');
    }
  }
);

export const fetchMembers = createAsyncThunk(
  'house/fetchMembers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await houseService.getMembers();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members');
    }
  }
);

export const createHouse = createAsyncThunk(
  'house/createHouse',
  async (houseData, { rejectWithValue }) => {
    try {
      const data = await houseService.createHouse(houseData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create house');
    }
  }
);

export const joinHouse = createAsyncThunk(
  'house/joinHouse',
  async (code, { rejectWithValue }) => {
    try {
      const data = await houseService.joinHouse(code);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join house');
    }
  }
);

export const removeMember = createAsyncThunk(
  'house/removeMember',
  async (memberId, { rejectWithValue }) => {
    try {
      await houseService.removeMember(memberId);
      return memberId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

export const fetchRules = createAsyncThunk(
  'house/fetchRules',
  async (_, { rejectWithValue }) => {
    try {
      const data = await houseService.getRules();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rules');
    }
  }
);

export const addRule = createAsyncThunk(
  'house/addRule',
  async (ruleData, { rejectWithValue }) => {
    try {
      const data = await houseService.addRule(ruleData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add rule');
    }
  }
);

export const deleteRule = createAsyncThunk(
  'house/deleteRule',
  async (ruleId, { rejectWithValue }) => {
    try {
      await houseService.deleteRule(ruleId);
      return ruleId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete rule');
    }
  }
);

const houseSlice = createSlice({
  name: 'house',
  initialState: {
    currentHouse: null,
    members: [],
    rules: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearHouseData: (state) => {
      state.currentHouse = null;
      state.members = [];
      state.rules = [];
    },
    setHouse: (state, action) => {
      state.currentHouse = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHouse.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHouse.fulfilled, (state, action) => {
        state.currentHouse = action.payload;
        state.loading = false;
      })
      .addCase(fetchHouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMembers.pending, (state) => { state.loading = true; })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members = action.payload;
        state.loading = false;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createHouse.pending, (state) => { state.loading = true; })
      .addCase(createHouse.fulfilled, (state, action) => {
        state.currentHouse = action.payload;
        state.loading = false;
      })
      .addCase(createHouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(joinHouse.pending, (state) => { state.loading = true; })
      .addCase(joinHouse.fulfilled, (state, action) => {
        state.currentHouse = action.payload;
        state.loading = false;
      })
      .addCase(joinHouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter(m => m.id !== action.payload && m.user_id !== action.payload);
      })
      .addCase(fetchRules.fulfilled, (state, action) => {
        state.rules = action.payload;
      })
      .addCase(addRule.fulfilled, (state, action) => {
        state.rules.push(action.payload);
      })
      .addCase(deleteRule.fulfilled, (state, action) => {
        state.rules = state.rules.filter(r => r.id !== action.payload);
      });
  },
});

export const { clearHouseData, setHouse } = houseSlice.actions;

export const selectHouse = (state) => state.house.currentHouse;
export const selectMembers = (state) => state.house.members;
export const selectHouseLoading = (state) => state.house.loading;
export const selectRules = (state) => state.house.rules;

export default houseSlice.reducer;
