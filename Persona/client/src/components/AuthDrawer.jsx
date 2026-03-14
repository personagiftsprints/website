"use client";

import { useState } from "react";
import { Mail, Lock, User, X,Eye, EyeOff } from "lucide-react";
import { checkEmail, emailAuth, googleAuth, sendResetLink } from "@/services/auth.service";

import { saveSession } from "@/lib/auth-storage";
import { useAuth } from "@/context/AuthContext";

export default function AuthDrawer({ open, onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const { setUser } = useAuth();

  const handleSendResetLink = async () => {
    if (!email) return;
    setLoading(true);
    const res = await sendResetLink(email);
    if (res.status === "success") {
      alert("Password reset link sent to your email.");
      setStep("email");
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        const res = await googleAuth(response.credential);
        if (res.token) {
          saveSession({ token: res.token, user: res.user });
          setUser(res.user);
          onClose();
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  const handleEmailSubmit = async () => {
    if (!email) return;
    setLoading(true);
    const res = await checkEmail(email);
    setIsExistingUser(res.exists);
    setStep("details");
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);

    const payload = {
      email,
      password,
      ...(isExistingUser ? {} : { firstName, lastName }),
    };

    const res = await emailAuth(payload);

    if (res.token) {
      saveSession({ token: res.token, user: res.user });
      setUser(res.user);
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className={`fixed inset-0 z-[100300] ${open ? "" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          open ? "opacity-40" : "opacity-0"
        }`}
      />

      {/* Drawer - Desktop: full width max-w-lg, Mobile: 85% width */}
      <div
        className={`absolute right-0 top-0 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        } w-full max-w-lg md:max-w-lg sm:max-w-[85%]`}
      >
        {/* Close Button - Mobile Only */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors md:hidden"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="h-full overflow-y-auto p-6 pt-16 md:pt-6 space-y-5">
          <h3 className="text-2xl font-semibold text-center">
            {step === "email"
              ? "Continue with Email"
              : step === "forgot"
              ? "Reset Password"
              : isExistingUser
              ? "Welcome Back"
              : "Create Your Account"}
          </h3>

          {step === "email" && (
            <>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <button
                disabled={loading}
                onClick={handleEmailSubmit}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : "Continue"}
              </button>
            </>
          )}

          {step === "details" && isExistingUser && (
            <>
<div className="relative">
  <Lock
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    size={18}
  />

  <input
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    type={showPassword ? "text" : "password"}
    placeholder={isExistingUser ? "Enter your password" : "Create a password"}
    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />

  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Please wait..." : "Login"}
              </button>

              <button
                onClick={() => setStep("forgot")}
                className="w-full text-sm text-orange-600 hover:text-orange-700 mt-2"
              >
                Forgot password?
              </button>
            </>
          )}

          {step === "forgot" && (
            <>
              <p className="text-sm text-gray-600 text-center">
                We'll send a password reset link to your email.
              </p>

              <button
                disabled={loading}
                onClick={handleSendResetLink}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                onClick={() => setStep("details")}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Back to login
              </button>
            </>
          )}

          {step === "details" && !isExistingUser && (
            <>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  type="text"
                  placeholder="First name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  type="text"
                  placeholder="Last name (optional)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

            <div className="relative">
  <Lock
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    size={18}
  />

  <input
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    type={showPassword ? "text" : "password"}
    placeholder="Create a password"
    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />

  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </>
          )}

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Button - Responsive width */}
          <div className="flex justify-center">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-full hover:bg-gray-50 transition w-full md:max-w-xs"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
                alt="Google"
              />
              <span className="text-sm font-medium">Continue with Google</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center leading-relaxed mt-4">
            By proceeding, you agree to our{" "}
            <a href="/terms" className="underline font-medium hover:text-gray-700">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline font-medium hover:text-gray-700">
              Privacy Policy
            </a>.
            <br className="hidden md:block" />
            Persona Gifts & Prints respects your data and processes it securely.
          </p>
        </div>
      </div>
    </div>
  );
}