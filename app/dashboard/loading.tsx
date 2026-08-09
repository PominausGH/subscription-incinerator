export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="mt-2 h-4 w-64 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-gray-200 rounded"></div>
            <div className="h-9 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Add Form Skeleton */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Subscriptions List Skeleton */}
      <div>
        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
