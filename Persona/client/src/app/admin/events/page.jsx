"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import {
  getEvents,
  createEvent,
  deleteEvent,
  toggleEventStatus
} from "@/services/event.service";
import { getActiveCollections } from "@/services/collection.service";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({ title: "", slug: "", description: "", collectionRef: "" });

  const fetchData = async () => {
    try {
      const evtRes = await getEvents();
      if (evtRes) setEvents(evtRes);

      const colRes = await getActiveCollections();
      if (colRes) setCollections(colRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateSlug = (text) => {
    return text.toLowerCase().trim().replace(/[\s\W-]+/g, "-");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (events.length > 0) {
      if (!confirm("Creating a new event will delete the currently active event. Do you want to continue?")) {
        return;
      }
    }

    try {
      await createEvent(form);
      setIsModalOpen(false);
      setForm({ title: "", slug: "", description: "", collectionRef: "" });
      fetchData();
    } catch (error) {
      alert("Error creating event");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      fetchData();
    } catch (error) {
      alert("Error deleting event");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleEventStatus(id);
      fetchData();
    } catch (error) {
      alert("Error toggling status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Events</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          <Plus size={18} /> New Event
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-3">Title</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Collection</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt) => (
              <tr key={evt._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 font-medium">
                  {evt.title}
                  <div className="text-xs text-gray-500 font-normal">{evt.slug}</div>
                </td>
                <td className="py-3 text-gray-600 text-sm max-w-xs truncate">{evt.description}</td>
                <td className="py-3 text-gray-500">{evt.collectionRef?.title || 'N/A'}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${evt.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {evt.isActive !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 text-right space-x-2">
                  <button
                    onClick={() => handleToggleStatus(evt._id)}
                    className={`${evt.isActive !== false ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'}`}
                    title={evt.isActive !== false ? "Disable" : "Enable"}
                  >
                    {evt.isActive !== false ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(evt._id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Event</h2>
            {events.length > 0 && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-100">
                <strong>Note:</strong> Creating a new event will automatically delete the currently active event. Only one event can exist at a time.
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })}
                  className="w-full p-2 border rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Collection</label>
                <select
                  required
                  value={form.collectionRef}
                  onChange={(e) => setForm({ ...form, collectionRef: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a collection...</option>
                  {collections.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
