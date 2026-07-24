"use client"

import { useState, useEffect } from "react"
import { getSettings, updateSettings, testEmailService } from "@/services/settings.service"
import {
  Save,
  ShieldAlert,
  Clock,
  Info,
  Truck,
  ExternalLink,
  Mail,
  CheckCircle2,
  Sliders,
  Settings,
  Zap,
  Check
} from "lucide-react"
import Link from "next/link"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [testEmail, setTestEmail] = useState("personagiftsprints@gmail.com")
  const [testingEmail, setTestingEmail] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert("Please enter a valid email address.")
      return
    }
    try {
      setTestingEmail(true)
      const res = await testEmailService(testEmail)
      if (res.success) {
        alert(res.message || "Test email sent successfully!")
      } else {
        alert("Failed to send test email: " + (res.message || "Unknown error"))
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
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      console.error("Update failed:", err)
      alert("Failed to update settings")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse p-2">
        <div className="h-28 bg-gray-200 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-72 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-72 bg-gray-100 rounded-2xl border border-gray-200" />
          <div className="h-72 bg-gray-100 rounded-2xl border border-gray-200" />
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="w-full p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Failed to Load Settings</h2>
        <p className="text-sm text-gray-500">Could not retrieve system configuration parameters.</p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl"
        >
          Retry Loading
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 pb-20">

      {/* HEADER BANNER - FULL WIDTH */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            <Settings className="w-3.5 h-3.5 text-gray-500" />
            <span>Platform Operations</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            System & Store Settings
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Manage global website configurations, maintenance mode, shipping pricing, and email delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings Saved!
            </span>
          )}

          <button
            onClick={handleUpdate}
            disabled={updating}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{updating ? "Saving Changes..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN FULL-WIDTH GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

        {/* 1. MAINTENANCE MODE */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-red-50/80 p-5 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-red-950">Maintenance Mode</h2>
                  <p className="text-xs text-red-600">Control public store availability</p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                settings.maintenanceMode?.isActive
                  ? "bg-red-600 text-white border-red-700"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}>
                {settings.maintenanceMode?.isActive ? "ON - Store Offline" : "OFF - Store Live"}
              </span>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-sm text-gray-900">Activate Maintenance Screen</p>
                  <p className="text-xs text-gray-500">When active, public customers will see a maintenance notice.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode?.isActive || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenanceMode: { ...settings.maintenanceMode, isActive: e.target.checked }
                    })}
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Info className="w-4 h-4 text-red-500" />
                    Maintenance Notice Message
                  </label>
                  <textarea
                    value={settings.maintenanceMode?.message || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenanceMode: { ...settings.maintenanceMode, message: e.target.value }
                    })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition"
                    placeholder="We're currently performing scheduled system updates. Please check back shortly!"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-red-500" />
                    Expected Completion Time
                  </label>
                  <input
                    type="datetime-local"
                    value={settings.maintenanceMode?.expectedEndTime ? new Date(settings.maintenanceMode.expectedEndTime).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenanceMode: { ...settings.maintenanceMode, expectedEndTime: e.target.value }
                    })}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SHIPPING CONFIGURATION */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-blue-50/80 p-5 border-b border-blue-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-blue-950">Shipping Rules & Thresholds</h2>
                <p className="text-xs text-blue-600">Standard delivery costs and free shipping limits</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Standard Delivery Fee (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.shipping?.deliveryCharge ?? 0}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, deliveryCharge: Number(e.target.value) }
                      })}
                      className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-base font-extrabold text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                      placeholder="5.00"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">Flat shipping charge applied to orders under threshold.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Free Shipping Threshold (£)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.shipping?.threshold ?? 0}
                      onChange={(e) => setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, threshold: Number(e.target.value) }
                      })}
                      className="w-full border border-gray-200 rounded-2xl pl-9 pr-4 py-3 text-base font-extrabold text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                      placeholder="100.00"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">Orders at or above this cart total receive £0 delivery.</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Cart Calculation Summary
                </p>
                <p>
                  Orders under <span className="font-bold">£{settings.shipping?.threshold || 0}</span> pay <span className="font-bold">£{settings.shipping?.deliveryCharge || 0}</span> delivery fee. Orders <span className="font-bold">£{settings.shipping?.threshold || 0}+</span> unlock FREE UK delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TRENDING PRODUCTS SELECTION MODE */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-purple-50/80 p-5 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-purple-950">Trending Products Algorithm</h2>
                  <p className="text-xs text-purple-600">Choose how homepage trending products are picked</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    trendingSettings: { ...settings.trendingSettings, mode: 'automatic' }
                  })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    settings.trendingSettings?.mode === 'automatic'
                      ? "border-purple-600 bg-purple-50/60 text-purple-950 shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <p className="font-extrabold text-sm mb-1">Automatic (Sales)</p>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Automatically highlights items with highest order counts.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    trendingSettings: { ...settings.trendingSettings, mode: 'manual' }
                  })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    settings.trendingSettings?.mode === 'manual'
                      ? "border-purple-600 bg-purple-50/60 text-purple-950 shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                  }`}
                >
                  <p className="font-extrabold text-sm mb-1">Manual Selection</p>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Displays products explicitly flagged as 'Trending' by admins.
                  </p>
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Curate Manual List</p>
                  <p className="text-[11px] text-gray-500">Pick exact products for the homepage grid.</p>
                </div>
                <Link
                  href="/admin/trending"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Manage List</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. EMAIL SERVICE VERIFICATION */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-emerald-50/80 p-5 border-b border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-950">Email Service Verification</h2>
                <p className="text-xs text-emerald-600">Test SMTP and transactional email delivery</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-xs text-gray-500 leading-relaxed">
                Send a live test verification email to ensure transactional notifications (order receipts, invoice updates) are sending cleanly without delivery failures.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 font-semibold focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition"
                    placeholder="personagiftsprints@gmail.com"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  <span>{testingEmail ? "Dispatching Test Email..." : "Send Test Verification Email"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
