"use client"

import { useState, useEffect } from "react"
import { getSettings, updateSettings, testEmailService } from "@/services/settings.service"
import { Save, ShieldAlert, Clock, Info, Truck, ExternalLink, Mail } from "lucide-react"
import Link from "next/link"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [testEmail, setTestEmail] = useState("personagiftsprints@gmail.com")
  const [testingEmail, setTestingEmail] = useState(false)

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter a valid email address.")
      return
    }
    try {
      setTestingEmail(true)
      const res = await testEmailService(testEmail)
      if (res.data?.success) {
        alert(res.data.message || "Test email sent successfully!")
      } else {
        alert("Failed to send test email: " + (res.data?.message || "Unknown error"))
      }
    } catch (err) {
      console.error("Test email failed:", err)
      alert("Failed to send test email: " + (err.response?.data?.message || err.message))
    } finally {
      setTestingEmail(false)
    }
  }

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
                  checked={settings.maintenanceMode?.isActive}
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
                  value={settings.maintenanceMode?.message}
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
                  value={settings.maintenanceMode?.expectedEndTime ? new Date(settings.maintenanceMode.expectedEndTime).toISOString().slice(0, 16) : ""}
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

        {/* Shipping Configuration Section */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-3">
            <Truck className="text-blue-600" size={24} />
            <h2 className="text-lg font-bold text-blue-900">Shipping Configuration</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Delivery Charge (GBP)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium font-mono group-focus-within:text-blue-500 transition-colors">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.shipping?.deliveryCharge ?? 0}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, deliveryCharge: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-gray-900 font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      placeholder="5.00"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Standard delivery fee applied to orders below the threshold.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
                    Free Shipping Threshold (GBP)
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium font-mono group-focus-within:text-blue-500 transition-colors">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.shipping?.threshold ?? 0}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, threshold: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-gray-900 font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                      placeholder="100.00"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Orders equal to or above this amount will have free delivery.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trending Products Configuration Section */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center gap-3">
            <Info className="text-purple-600" size={24} />
            <h2 className="text-lg font-bold text-purple-900">Trending Products Configuration</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Trending Selection Mode
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      trendingSettings: { ...settings.trendingSettings, mode: 'automatic' }
                    })}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                      settings.trendingSettings?.mode === 'automatic'
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    Automatic (By Sales)
                  </button>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      trendingSettings: { ...settings.trendingSettings, mode: 'manual' }
                    })}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                      settings.trendingSettings?.mode === 'manual'
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                    }`}
                  >
                    Manual Selection
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {settings.trendingSettings?.mode === 'manual'
                    ? "In manual mode, only products specifically marked as 'Trending' will be shown."
                    : "In automatic mode, products with the highest number of sales (orders) will be shown."}
                </p>

                <div className="mt-6 pt-6 border-t flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">Curate Trending List</p>
                      <p className="text-xs text-gray-500">Add or remove products from the trending section manually.</p>
                    </div>
                    <Link 
                      href="/admin/trending"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
                    >
                      <ExternalLink size={16} />
                      Manage Trending
                    </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Service Verification Section */}
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-3">
            <Mail className="text-green-600" size={24} />
            <h2 className="text-lg font-bold text-green-900">Email Service Verification</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Verify that the email system is working correctly by sending a test email. The test email will contain verification success confirmation along with the current date and time.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-4 focus:ring-green-100 focus:border-green-400 transition-all outline-none"
                    placeholder="personagiftsprints@gmail.com"
                  />
                </div>
                
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-green-100"
                >
                  <Mail size={18} />
                  {testingEmail ? "Sending Test..." : "Send Test Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
