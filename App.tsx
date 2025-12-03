import React, { useState } from 'react';
import { useGameSync } from './services/gameService';
import TeacherDashboard from './components/TeacherDashboard';
import StudentView from './components/StudentView';
import SpectatorScreen from './components/SpectatorScreen';
import { Users, Monitor, ShieldCheck, Gamepad2, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const gameService = useGameSync();
  const { gameState } = gameService;

  // Simple local state to determine which view to render
  const [role, setRole] = useState<'SELECT' | 'TEACHER' | 'STUDENT' | 'SCREEN'>('SELECT');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleJoinAsStudent = () => {
    if (!tempName.trim()) return;
    const id = gameService.joinGame(tempName);
    setStudentId(id);
    setRole('STUDENT');
  };

  const handleBackToHome = () => {
    setRole('SELECT');
    setStudentId(null);
    setTempName('');
  };

  if (role === 'TEACHER') {
    return <TeacherDashboard gameState={gameState} actions={gameService} onLeave={handleBackToHome} />;
  }

  if (role === 'SCREEN') {
    return <SpectatorScreen gameState={gameState} onLeave={handleBackToHome} />;
  }

  if (role === 'STUDENT' && studentId) {
    return (
      <StudentView 
        gameState={gameState} 
        playerId={studentId} 
        onBuzz={() => gameService.buzz(studentId)}
        onSubmitRound2={(code) => gameService.submitRound2(studentId, code)}
        onLeave={handleBackToHome}
      />
    );
  }

  // Landing / Role Selection Screen
  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-cyber-light rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-8 text-center border-b border-gray-700">
          <h1 className="text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
            CODING SHOWDOWN
          </h1>
          <p className="text-gray-400">Select your role to enter the arena</p>
          <div className="mt-6 flex flex-col items-center gap-3">
             <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-600/50 rounded text-yellow-200 text-sm">
                ⚠ Open this URL in multiple tabs to simulate Teacher, Screen, and Students simultaneously.
             </div>
             <button 
               onClick={() => window.open(window.location.href, '_blank')}
               className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 text-cyan-400"
             >
                <ExternalLink size={16} /> Open New Testing Tab
             </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-700">
          
          {/* Teacher Option */}
          <div className="p-8 flex flex-col items-center hover:bg-slate-800 transition-colors cursor-pointer group" onClick={() => setRole('TEACHER')}>
            <ShieldCheck size={64} className="text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-white mb-2">Teacher / MC</h2>
            <p className="text-gray-500 text-center text-sm">Control rounds, questions, and scoring.</p>
          </div>

          {/* Screen Option */}
          <div className="p-8 flex flex-col items-center hover:bg-slate-800 transition-colors cursor-pointer group" onClick={() => setRole('SCREEN')}>
            <Monitor size={64} className="text-cyan-500 mb-6 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-white mb-2">Main Screen</h2>
            <p className="text-gray-500 text-center text-sm">Projector view for parents and audience.</p>
          </div>

          {/* Student Option */}
          <div className="p-8 flex flex-col items-center hover:bg-slate-800 transition-colors group">
            <Gamepad2 size={64} className="text-rose-500 mb-6 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-white mb-4">Student</h2>
            <div className="w-full">
               <input 
                  type="text" 
                  placeholder="Enter your name" 
                  className="w-full bg-black text-white px-4 py-2 rounded border border-gray-600 mb-3 focus:border-rose-500 focus:outline-none"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
               />
               <button 
                  onClick={handleJoinAsStudent}
                  disabled={!tempName}
                  className="w-full bg-rose-600 disabled:opacity-50 hover:bg-rose-700 text-white font-bold py-2 rounded transition-colors"
               >
                  Join Game
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;