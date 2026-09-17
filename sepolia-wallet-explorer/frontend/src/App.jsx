import React from 'react';
import Explorer from './pages/Explorer';
import './index.css';

function App() {
  return (
    <div className="App selection:bg-white selection:text-black min-h-screen bg-black text-white">
      <Explorer />
    </div>
  );
}

export default App;
