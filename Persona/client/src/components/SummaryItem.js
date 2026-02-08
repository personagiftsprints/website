export default function SummaryItem({ label, value, mono = false, status = "default" }) {
  const statusColors = {
    default: "text-gray-900",
    success: "text-green-600",
    warning: "text-amber-600"
  }
  
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${statusColors[status]} ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  )
}