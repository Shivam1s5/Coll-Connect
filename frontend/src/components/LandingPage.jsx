import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold mb-4 text-blue-500">Coll-Connect</h1>
      <p className="text-xl mb-8 text-gray-300 max-w-2xl text-center">
        Meet new people, talk to strangers, and make friends instantly with our secure random video chat platform.
      </p>
      
      <div className="flex gap-4">
        <button 
          onClick={() => navigate('/app')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
        >
          Start Chatting
        </button>
        <button 
          onClick={() => navigate('/auth')}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors"
        >
          Login / Register
        </button>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-3xl mb-2">🎥</div>
          <h3 className="text-xl font-bold mb-2">HD Video</h3>
          <p className="text-gray-400">Crystal clear video and audio quality for the best experience.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-3xl mb-2">🔒</div>
          <h3 className="text-xl font-bold mb-2">Secure</h3>
          <p className="text-gray-400">Your privacy is our top priority. Safe and moderated chats.</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
          <p className="text-gray-400">Connect with strangers around the world in milliseconds.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
