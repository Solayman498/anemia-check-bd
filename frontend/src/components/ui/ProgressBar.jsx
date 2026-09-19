// src/components/ui/ProgressBar.jsx
export function ProgressBar({ value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${colors[color] || colors.blue}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}