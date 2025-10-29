import React from 'react'
import useUserStore from "../../stores/useUserStore";

const UserInfo = () => {
    const { user, setUser } = useUserStore();
  return (
    <div className='flex flex-col items-center space-y-3'>
      <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full overflow-hidden flex items-center justify-center text-white shadow-lg'>
        <img src={user.profilePic} />
        
      </div>
     
    </div>
  )
}

export default UserInfo