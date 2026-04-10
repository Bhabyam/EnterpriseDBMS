export default function MetricCard({ title, value, change }) {
  return (
    <div className="p-5 rounded-2xl border shadow-sm bg-white text-gray-900">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <h2 className="text-2xl font-bold mt-1">
        {value}
      </h2>

      {change && (
        <p className="text-sm text-green-500 mt-2">
          {change}
        </p>
      )}
    </div>
  );
}