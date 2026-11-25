import React, { useState } from 'react';

interface Objection {
  id: string;
  text: string;
  cluster: string;
  frequency: number;
  evidenceThresholdMet: boolean;
}

export default function ObjectionClustering() {
  const [objections, setObjections] = useState<Objection[]>([
    { id: '1', text: 'We already use an incumbent agency.', cluster: 'Competitor / incumbent', frequency: 12, evidenceThresholdMet: true },
    { id: '2', text: 'Is this just another automated SDR factory?', cluster: 'Service perception', frequency: 8, evidenceThresholdMet: true },
    { id: '3', text: 'Pricing is too high for our current budget.', cluster: 'Price sensitivity', frequency: 5, evidenceThresholdMet: true },
    { id: '4', text: 'How do you ensure UK regulatory compliance?', cluster: 'Compliance / risk', frequency: 4, evidenceThresholdMet: true },
    { id: '5', text: 'What is your direct sector background?', cluster: 'Trust / authority', frequency: 3, evidenceThresholdMet: true },
    { id: '6', text: 'We have no bandwidth to onboard right now.', cluster: 'Capacity / timing', frequency: 2, evidenceThresholdMet: false },
  ]);

  const [newObjectionText, setNewObjectionText] = useState('');
  const [newCluster, setNewCluster] = useState('Competitor / incumbent');

  const handleAddObjection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjectionText.trim()) return;

    const existing = objections.find(o => o.cluster.toLowerCase() === newCluster.toLowerCase());
    const newFreq = existing ? existing.frequency + 1 : 1;

    const created: Objection = {
      id: Date.now().toString(),
      text: newObjectionText,
      cluster: newCluster,
      frequency: newFreq,
      evidenceThresholdMet: newFreq >= 3
    };

    setObjections([created, ...objections]);
    setNewObjectionText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '8px' }}>Objection Clustering</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
          Semantic similarity grouping across recorded calls. Patterns are validated at <strong style={{ color: 'var(--text-primary)' }}>n≥3</strong> threshold.
        </p>

        <form onSubmit={handleAddObjection} style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter objection observation..."
            value={newObjectionText}
            onChange={(e) => setNewObjectionText(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          />
          <select
            value={newCluster}
            onChange={(e) => setNewCluster(e.target.value)}
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value="Competitor / incumbent">Competitor / incumbent</option>
            <option value="Service perception">Service perception</option>
            <option value="Price sensitivity">Price sensitivity</option>
            <option value="Compliance / risk">Compliance / risk</option>
            <option value="Trust / authority">Trust / authority</option>
            <option value="Capacity / timing">Capacity / timing</option>
          </select>
          <button type="submit" className="btn btn-primary">Add Objection</button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {objections.map(obj => (
            <div
              key={obj.id}
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontWeight: 500, fontSize: '15px' }}>{obj.text}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Cluster: <span style={{ color: 'var(--text-primary)' }}>{obj.cluster}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: obj.evidenceThresholdMet ? 'var(--accent-muted)' : 'var(--warning-muted)',
                  color: obj.evidenceThresholdMet ? 'var(--accent-primary)' : 'var(--warning)',
                  fontWeight: 500
                }}>
                  {obj.frequency} mentions {obj.evidenceThresholdMet ? '(n≥3 Validated)' : '(Hypothesis)'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

