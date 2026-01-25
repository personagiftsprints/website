export default function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
        active 
          ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}