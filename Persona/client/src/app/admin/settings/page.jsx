"use client"

import { useState, useEffect } from "react"
import { getSettings, updateSettings } from "@/services/settings.service"
import { Save, ShieldAlert, Clock, Info } from "lucide-react"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await getSettings()
      setSettings(res.data)
    } catch (err) {
      console.error("Failed to load settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      await updateSettings(settings)
      alert("Settings updated successfully!")
    } catch (err) {
      console.error("Update failed:", err)
      alert("Failed to update settings")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading settings...</div>
  if (!settings) return <div className="p-10 text-center text-red-500">Failed to load settings. Please try again.</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500">Manage global website configurations</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {updating ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-8">
        {/* Maintenance Mode Section */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
            <ShieldAlert className="text-red-600" size={24} />
            <h2 className="text-lg font-bold text-red-900">Maintenance Mode</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
              <div>
                <p className="font-bold text-gray-900">Activate Maintenance Mode</p>
                <p className="text-sm text-gray-500">When active, public users will see a maintenance screen.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.maintenanceMode.isActive}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenanceMode: { ...settings.maintenanceMode, isActive: e.target.checked }
                  })}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Info size={16} /> Maintenance Message
                </label>
                <textarea
                  value={settings.maintenanceMode.message}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenanceMode: { ...settings.maintenanceMode, message: e.target.value }
                  })}
                  className="w-full border rounded-xl px-4 py-2 resize-none h-24 focus:ring-2 focus:ring-red-100 outline-none"
                  placeholder="Tell your users what's happening..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock size={16} /> Expected Completion Time
                </label>
                <input
                  type="datetime-local"
                  value={settings.maintenanceMode.expectedEndTime ? new Date(settings.maintenanceMode.expectedEndTime).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenanceMode: { ...settings.maintenanceMode, expectedEndTime: e.target.value }
                  })}
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-100 outline-none"
                />
                <p className="text-[10px] text-gray-400">Optional: Users will see this as the estimated uptime.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
