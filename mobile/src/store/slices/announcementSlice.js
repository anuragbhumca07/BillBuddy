import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { announcementService } from '../../services/announcementService';

export const fetchAnnouncements = createAsyncThunk(
  'announcements/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const data = await announcementService.getAnnouncements();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

export const addAnnouncement = createAsyncThunk(
  'announcements/addAnnouncement',
  async (announcementData, { rejectWithValue }) => {
    try {
      const data = await announcementService.createAnnouncement(announcementData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add announcement');
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'announcements/deleteAnnouncement',
  async (announcementId, { rejectWithValue }) => {
    try {
      await announcementService.deleteAnnouncement(announcementId);
      return announcementId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete announcement');
    }
  }
);

const announcementSlice = createSlice({
  name: 'announcements',
  initialState: {
    announcements: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAnnouncementError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload;
        state.loading = false;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addAnnouncement.pending, (state) => { state.loading = true; })
      .addCase(addAnnouncement.fulfilled, (state, action) => {
        state.announcements.unshift(action.payload);
        state.loading = false;
      })
      .addCase(addAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.announcements = state.announcements.filter(a => a.id !== action.payload);
      });
  },
});

export const { clearAnnouncementError } = announcementSlice.actions;

export const selectAnnouncements = (state) => state.announcements.announcements;
export const selectAnnouncementLoading = (state) => state.announcements.loading;

export default announcementSlice.reducer;
