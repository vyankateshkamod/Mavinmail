// src/components/ExploreScreen.tsx
function ExploreScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#121212] text-white">
      <h1 className="text-2xl font-bold mb-4">Chat History</h1>
      <p className="text-gray-400">This is your Chat History page. </p>
      <p>Only last 100 chats will be locally stored on users chrome local Storage</p>
    </div>
  );
}

export default ExploreScreen;
