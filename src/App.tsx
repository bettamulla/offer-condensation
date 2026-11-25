import { useState } from 'react';
import './index.css';
import Capture from './components/Capture';
import OfferFramework from './components/OfferFramework';
import ObjectionClustering from './components/ObjectionClustering';
import ResponseTracking from './components/ResponseTracking';
import CondensationEngine from './components/CondensationEngine';
import ExportCompliance from './components/ExportCompliance';
import { useAutoCompact } from './hooks/useAutoCompact';

function App() {
  const [activeTab, setActiveTab] = useState('capture');
  const [history] = useState([]);

  useAutoCompact(history, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600 }}>Offer Condensation</h1>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {['capture', 'framework', 'cluster', 'track', 'condense', 'export'].map(tab => (
            <button
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {activeTab === 'capture' && <Capture />}
        {activeTab === 'framework' && <OfferFramework />}
        {activeTab === 'cluster' && <ObjectionClustering />}
        {activeTab === 'track' && <ResponseTracking />}
        {activeTab === 'condense' && <CondensationEngine />}
        {activeTab === 'export' && <ExportCompliance />}
      </main>
    </div>
  );
}

export default App;
