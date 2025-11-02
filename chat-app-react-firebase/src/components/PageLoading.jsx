import React from "react";

const PageLoading = () => {
  return (
    <div className="w-full h-screen fixed top-0 left-0 z-50 flex items-center justify-center">
      <div className="w-full fixed top-0 left-0">
        <div className="h-1 w-full bg-gray-100 overflow-hidden">
          <div className="page-loading-progress w-full h-full bg-black left-right" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <img
            className="w-16 h-16 animate-pulse"
            src="https://images.icon-icons.com/3249/PNG/512/chat_filled_icon_200790.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default PageLoading;
