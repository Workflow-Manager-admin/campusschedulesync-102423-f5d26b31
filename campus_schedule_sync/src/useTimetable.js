import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./SupabaseProvider";

/**
 * PUBLIC_INTERFACE
 * useTimetable - Custom React hook for loading/managing timetable (session) entries via Supabase.
 * 
 * CRUD for session entries. Keeps local state in sync with DB.
 * 
 * Table 'timetable' assumed structure:
 * - id, course_id, faculty_id, room_id, day, start_time, end_time
 * 
 * @returns {object} - { sessions, loading, error, addSession, updateSession, deleteSession, refresh }
 */
export function useTimetable() {
  const supabase = useSupabase();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all timetable sessions from Supabase
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("timetable")
      .select("*")
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) {
      setError("Failed to fetch timetable: " + error.message);
      setSessions([]);
    } else {
      setSessions(data || []);
      setError("");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line
  }, []);

  // PUBLIC_INTERFACE
  /** Add a timetable session */
  const addSession = async (entry) => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("timetable")
      .insert([entry])
      .select();
    setLoading(false);
    if (error) {
      setError("Failed to create session: " + error.message);
      return false;
    }
    // Append new session to state
    setSessions((prev) => [...prev, ...(data || [])]);
    return true;
  };

  // PUBLIC_INTERFACE
  /** Update a timetable session by id */
  const updateSession = async (id, updates) => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("timetable")
      .update(updates)
      .eq("id", id)
      .select();
    setLoading(false);
    if (error) {
      setError("Failed to update session: " + error.message);
      return false;
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? (data && data[0] ? data[0] : { ...s, ...updates }) : s))
    );
    return true;
  };

  // PUBLIC_INTERFACE
  /** Delete a timetable session by id */
  const deleteSession = async (id) => {
    setLoading(true);
    setError("");
    const { error } = await supabase.from("timetable").delete().eq("id", id);
    setLoading(false);
    if (error) {
      setError("Failed to delete session: " + error.message);
      return false;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    return true;
  };

  // PUBLIC_INTERFACE
  /** Refresh timetable from DB */
  const refresh = () => {
    fetchSessions();
  };

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    refresh,
  };
}

export default useTimetable;
