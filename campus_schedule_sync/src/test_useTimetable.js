import { renderHook, act } from '@testing-library/react-hooks';
import { createContext, useContext } from 'react';
import useTimetable from './useTimetable';

/**
 * Mocks the Supabase client and context for useTimetable hook.
 */
function getMockSupabase({ fetchSessionsData = [], fetchError = null, insertError = null, updateError = null, deleteError = null }) {
  return {
    from: jest.fn((table) => ({
      select: jest.fn(() => ({
        order: jest.fn((col) => ({
          order: jest.fn(() => ({
            data: fetchSessionsData,
            error: fetchError,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: insertError ? null : [{ id: 999, ...insertError?.entry }],
          error: insertError || null,
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            data: updateError ? null : [{ id: 1, ...updateError?.updates }],
            error: updateError || null,
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: deleteError || null,
        })),
      })),
      order: jest.fn(() => ({
        order: jest.fn(() => ({
          data: fetchSessionsData,
          error: fetchError,
        })),
      })),
    })),
  };
}

// Mock useSupabase (imported in useTimetable)
jest.mock('./SupabaseProvider', () => {
  let supabaseMock = null;
  return {
    useSupabase: () => supabaseMock,
    __setMockSupabase: (mock) => (supabaseMock = mock),
  };
});

const { __setMockSupabase } = require('./SupabaseProvider');

describe('useTimetable hook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads sessions (fetchSessions) on mount', async () => {
    const mockData = [{ id: 1, course_id: 1, day: 'Monday', start_time: '09:00', end_time: '10:00' }];
    const mockClient = getMockSupabase({ fetchSessionsData: mockData });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());

    // Wait for useEffect to finish fetch
    await waitForNextUpdate();

    expect(result.current.sessions).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('handles errors during fetchSessions on mount', async () => {
    const error = { message: 'DB error' };
    const mockClient = getMockSupabase({ fetchSessionsData: [], fetchError: error });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());

    await waitForNextUpdate();
    expect(result.current.sessions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toMatch(/Failed to fetch/);
  });

  it('addSession succeeds and updates state', async () => {
    const newSession = { course_id: 2, day: 'Tuesday', start_time: '11:00', end_time: '12:00' };
    const mockClient = getMockSupabase({});
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    await act(async () => {
      const ok = await result.current.addSession(newSession);
      expect(ok).toBe(true);
    });

    expect(result.current.sessions[result.current.sessions.length - 1]).toMatchObject(newSession);
    expect(result.current.error).toBe('');
  });

  it('addSession handles errors and shows error state', async () => {
    const error = { message: 'Insert failed' };
    const mockClient = getMockSupabase({ insertError: error });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    await act(async () => {
      const ok = await result.current.addSession({ course_id: 3 });
      expect(ok).toBe(false);
    });
    expect(result.current.error).toMatch(/Failed to create/);
  });

  it('updateSession updates the correct session and state', async () => {
    const sessions = [{ id: 1, course_id: 1, day: 'Monday', start_time: '09:00', end_time: '10:00' }];
    const updates = { start_time: '10:00' };
    const mockClient = getMockSupabase({ fetchSessionsData: sessions, updateError: { updates } });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    await act(async () => {
      const ok = await result.current.updateSession(1, updates);
      expect(ok).toBe(true);
    });
    expect(result.current.error).toBe('');
  });

  it('updateSession handles errors and shows error state', async () => {
    const sessions = [{ id: 1, course_id: 1, day: 'Monday', start_time: '09:00', end_time: '10:00' }];
    const error = { message: 'Update failed' };
    const mockClient = getMockSupabase({ fetchSessionsData: sessions, updateError: error });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    await act(async () => {
      const ok = await result.current.updateSession(1, { start_time: '13:00' });
      expect(ok).toBe(false);
    });

    expect(result.current.error).toMatch(/Failed to update/);
  });

  it('deleteSession removes the correct session from state', async () => {
    const sessions = [
      { id: 1, course_id: 1, day: 'Monday', start_time: '09:00', end_time: '10:00' },
      { id: 2, course_id: 2, day: 'Tuesday', start_time: '11:00', end_time: '12:00' },
    ];

    // Provide delete stub and normal fetchSessions
    const mockClient = getMockSupabase({ fetchSessionsData: sessions });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    await act(async () => {
      const ok = await result.current.deleteSession(2);
      expect(ok).toBe(true);
    });

    expect(result.current.sessions.find((s) => s.id === 2)).toBeUndefined();
    expect(result.current.error).toBe('');
  });

  it('deleteSession handles errors', async () => {
    const sessions = [
      { id: 1, course_id: 1, day: 'Monday', start_time: '09:00', end_time: '10:00' },
      { id: 2, course_id: 2, day: 'Tuesday', start_time: '11:00', end_time: '12:00' },
    ];
    const error = { message: 'Delete failed' };
    const mockClient = getMockSupabase({ fetchSessionsData: sessions, deleteError: error });
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    await act(async () => {
      const ok = await result.current.deleteSession(1);
      expect(ok).toBe(false);
    });

    expect(result.current.error).toMatch(/Failed to delete/);
  });

  it('refresh triggers a re-fetch of sessions', async () => {
    // Two fetch cycles, second has different data
    let callNumber = 0;
    const mockClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            order: jest.fn(() => ({
              data: callNumber++ === 0 ?
                [{ id: 1, course_id: 10, day: 'Wednesday', start_time: '10:00', end_time: '11:00' }]
                : [{ id: 2, course_id: 12, day: 'Friday', start_time: '12:00', end_time: '13:00' }],
              error: null,
            }))
          })),
        })),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        order: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [{ id: 1, course_id: 10, day: 'Wednesday', start_time: '10:00', end_time: '11:00' }],
            error: null,
          }))
        })),
      })),
    };
    __setMockSupabase(mockClient);

    const { result, waitForNextUpdate } = renderHook(() => useTimetable());
    await waitForNextUpdate();

    // Initial load
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe(1);

    // Refresh - should update sessions
    await act(async () => {
      result.current.refresh();
    });

    // After refresh, new data
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].id).toBe(2);
  });
});
