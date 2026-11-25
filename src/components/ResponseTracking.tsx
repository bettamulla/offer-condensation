import { useState } from 'react';

interface ResponseVariant {
  id: string;
  objectionId: string;
  objectionText: string;
  responseText: string;
  status: 'active' | 'testing' | 'archived';
  stats: {
    uses: number;
    saves: number;
    meetingsBooked: number;
  };
  evidenceLinks: { callId: string; quote: string }[];
  createdAt: string;
  lastUsedAt: string;
}

const INITIAL_VARIANTS: ResponseVariant[] = [
  {
    id: 'v1',
    objectionId: 'obj1',
    objectionText: 'We already use an agency.',
    responseText: 'Understood. Most of our clients did too before they realized they were paying for activity rather than qualified meetings. How many meetings did they book you last month?',
    status: 'active',
    stats: { uses: 42, saves: 12, meetingsBooked: 3 },
    evidenceLinks: [
      { callId: 'Call #3', quote: '"We\'re paying £2,500/month for activity reports."' },
      { callId: 'Call #7', quote: '"Our agency sends 50 emails, gets zero replies."' },
      { callId: 'Call #11', quote: '"Activity metrics don\'t pay my team\'s salaries."' },
    ],
    createdAt: '2026-11-05',
    lastUsedAt: '2026-11-20',
  },
  {
    id: 'v2',
    objectionId: 'obj1',
    objectionText: 'We already use an agency.',
    responseText: 'That makes sense—you wouldn\'t be where you are without one. Are they currently on a pay-per-meeting model or a monthly retainer?',
    status: 'testing',
    stats: { uses: 15, saves: 8, meetingsBooked: 2 },
    evidenceLinks: [
      { callId: 'Call #14', quote: '"We\'re on retainer... but pay-per-meeting sounds better."' },
    ],
    createdAt: '2026-11-12',
    lastUsedAt: '2026-11-19',
  },
  {
    id: 'v3',
    objectionId: 'obj3',
    objectionText: 'Too expensive.',
    responseText: 'Compared to what? If we book you a £50k deal for a £250 meeting, is that expensive or a high-yield investment?',
    status: 'active',
    stats: { uses: 28, saves: 5, meetingsBooked: 1 },
    evidenceLinks: [
      { callId: 'Call #9', quote: '"£300/meeting is steep for our budget."' },
      { callId: 'Call #16', quote: '"We can\'t justify the cost right now."' },
    ],
    createdAt: '2026-11-08',
    lastUsedAt: '2026-11-18',
  },
];

interface ObjectionCluster {
  id: string;
  label: string;
  frequency: number;
  variants: ResponseVariant[];
}

export default function ResponseTracking() {
  const [variants, setVariants] = useState<ResponseVariant[]>(INITIAL_VARIANTS);
  const [showCreateForm, setShowCreateForm] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({ objectionId: '', responseText: '' });

  const getClusteredVariants = () => {
    const clusters = new Map<string, ObjectionCluster>();
    variants.forEach(v => {
      const existing = clusters.get(v.objectionId);
      if (existing) {
        existing.variants.push(v);
        existing.frequency += v.stats.uses;
      } else {
        clusters.set(v.objectionId, {
          id: v.objectionId,
          label: v.objectionText,
          frequency: v.stats.uses,
          variants: [v],
        });
      }
    });
    return [...clusters.values()].sort((a, b) => b.frequency - a.frequency);
  };

  const handleCreateVariant = (objectionId: string) => {
    if (!newVariant.responseText.trim()) return;
    const variant: ResponseVariant = {
      id: `v${Date.now()}`,
      objectionId,
      objectionText: getClusteredVariants().find(c => c.id === objectionId)?.label || objectionId,
      responseText: newVariant.responseText,
      status: 'testing',
      stats: { uses: 0, saves: 0, meetingsBooked: 0 },
      evidenceLinks: [],
      createdAt: new Date().toISOString().split('T')[0],
      lastUsedAt: new Date().toISOString().split('T')[0],
    };
    setVariants([...variants, variant]);
    setShowCreateForm(null);
    setNewVariant({ objectionId: '', responseText: '' });
  };

  const handleRecordUse = (variantId: string, saved: boolean, meetingBooked: boolean) => {
    setVariants(prev =>
      prev.map(v => {
        if (v.id !== variantId) return v;
        return {
          ...v,
          stats: {
            uses: v.stats.uses + 1,
            saves: v.stats.saves + (saved ? 1 : 0),
            meetingsBooked: v.stats.meetingsBooked + (meetingBooked ? 1 : 0),
          },
          lastUsedAt: new Date().toISOString().split('T')[0],
          status: v.stats.uses >= 10 && v.status === 'testing' ? 'active' : v.status,
        };
      })
    );
  };

  const handleStatusChange = (variantId: string, status: ResponseVariant['status']) => {
    setVariants(prev =>
      prev.map(v => (v.id === variantId ? { ...v, status } : v))
    );
  };

  const handleAddEvidence = (variantId: string, callId: string, quote: string) => {
    setVariants(prev =>
      prev.map(v => {
        if (v.id !== variantId) return v;
        return {
          ...v,
          evidenceLinks: [...v.evidenceLinks, { callId, quote }],
        };
      })
    );
  };

  const clusters = getClusteredVariants();

  return (
    <div className="card">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Response A/B Tracking</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Test and track the effectiveness of different objection handle variants. Record usage outcomes to build evidence.
        </p>
      </div>

      {clusters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No variants yet. Create your first response variant above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {clusters.map(cluster => (
            <div key={cluster.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Objection Cluster
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{cluster.label}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {cluster.variants.length} variant{cluster.variants.length !== 1 ? 's' : ''} · {cluster.frequency} total uses
                  </span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  onClick={() => { setNewVariant({ objectionId: cluster.id, responseText: '' }); setShowCreateForm(cluster.id); }}
                >
                  + Add Variant
                </button>
              </div>

              {showCreateForm === cluster.id && (
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                      value={newVariant.responseText}
                      onChange={e => setNewVariant({ ...newVariant, responseText: e.target.value })}
                      placeholder="Enter response variant text..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-focus)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        resize: 'vertical',
                        minHeight: '70px'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-secondary" onClick={() => setShowCreateForm(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => handleCreateVariant(cluster.id)} disabled={!newVariant.responseText.trim()}>
                        Create Variant
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cluster.variants.map(variant => {
                  const saveRate = variant.stats.uses > 0 ? ((variant.stats.saves / variant.stats.uses) * 100).toFixed(1) : '0.0';
                  const meetingRate = variant.stats.uses > 0 ? ((variant.stats.meetingsBooked / variant.stats.uses) * 100).toFixed(1) : '0.0';
                  const isBest = cluster.variants.reduce((best, v) => v.stats.saves > best.stats.saves ? v : best, cluster.variants[0]).id === variant.id;

                  return (
                    <div
                      key={variant.id}
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-primary)',
                        border: isBest ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      {isBest && (
                        <div style={{ position: 'absolute', top: '-8px', right: '12px', backgroundColor: 'var(--accent-primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                          Best Save Rate
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              Variant {variant.id.slice(1)}
                            </span>
                            <select
                              value={variant.status}
                              onChange={e => handleStatusChange(variant.id, e.target.value as ResponseVariant['status'])}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px'
                              }}
                            >
                              <option value="active">Active</option>
                              <option value="testing">Testing</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                          <div style={{ fontSize: '15px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                            "{variant.responseText}"
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '24px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-color)',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Uses</span>
                          <span style={{ fontSize: '18px', fontWeight: 600 }}>{variant.stats.uses}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Saves</span>
                          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)' }}>{variant.stats.saves}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Meetings</span>
                          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-primary)' }}>{variant.stats.meetingsBooked}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Save Rate</span>
                          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)' }}>{saveRate}%</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Meeting Rate</span>
                          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-primary)' }}>{meetingRate}%</span>
                        </div>

                        <div style={{ flex: 1 }} />

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleRecordUse(variant.id, true, false)}
                          >
                            Record Save
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleRecordUse(variant.id, true, true)}
                          >
                            Record Meeting
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleRecordUse(variant.id, false, false)}
                          >
                            No Save
                          </button>
                        </div>
                      </div>

                      {variant.evidenceLinks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Evidence Links ({variant.evidenceLinks.length})</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {variant.evidenceLinks.map((link, i) => (
                              <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>[{link.callId}]</span>
                                <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>"{link.quote}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                        <input
                          type="text"
                          placeholder="Call ID (e.g. Call #17)"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            width: '140px'
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget as HTMLInputElement;
                              if (input.value.trim()) {
                                handleAddEvidence(variant.id, input.value.trim(), '');
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Quote from call"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            flex: 1
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget as HTMLInputElement;
                              const callIdInput = (e.currentTarget.previousElementSibling as HTMLInputElement);
                              if (input.value.trim() && callIdInput.value.trim()) {
                                handleAddEvidence(variant.id, callIdInput.value.trim(), input.value.trim());
                                input.value = '';
                                callIdInput.value = '';
                              }
                            }
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          Press Enter to add
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
