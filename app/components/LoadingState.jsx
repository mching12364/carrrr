export default function LoadingState() {
  return (
    <div className="mt-10 flex flex-col items-center">
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-4 border-b-4 border-transparent border-r-4 border-l-4 border-r-white/20 border-l-white/20 animate-pulse"></div>
      </div>
      <p className="mt-4 text-lg text-gray-300">Processing your request...</p>
      <p className="text-sm text-gray-400 mt-2">Getting car specifications</p>
    </div>
  );
}
