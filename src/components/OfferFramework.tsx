import React, { useState } from 'react';

type EvidenceClassification = 'observed' | 'hypothesis' | 'knowledge_gap';

interface EvidenceItem {
  text: string;
  classification: EvidenceClassification;
  callRef?: string;
  quote?: string;
}

interface OfferComponent {
  id: string;
  title: string;
  description: string;
  evidence: EvidenceItem[];
  status: 'draft' | 'validated' | 'needs_refinement';
}

const INITIAL_COMPONENTS: OfferComponent[] = [
  {
    id: 'promise',
    title: 'Promise',
    description: 'Book 15 qualified B2B sales meetings per month on a pay-per-meeting model without hiring full-time SDRs.',
    evidence: [
      { text: 'Prospect: "We need more qualified meetings, not more leads."', classification: 'observed', callRef: 'Call #3', quote: '"We need more qualified meetings, not more leads."' },
      { text: 'Prospect: "If you can guarantee show-ups, that changes things."', classification: 'observed', callRef: 'Call #7', quote: '"If you can guarantee show-ups, that changes things."' },
      { text: 'Pattern: Pay-per-meeting removes hiring friction for 60% of prospects.', classification: 'hypothesis', callRef: 'Calls #2, #5, #8' },
    ],
    status: 'validated',
  },
  {
    id: 'proof',
    title: 'Proof',
    description: 'Case study: UK SaaS client scaled from 3 to 18 meetings in 30 days with zero upfront retainer.',
    evidence: [
      { text: 'Prospect: "Can you prove this works for UK markets?"', classification: 'observed', callRef: 'Call #12', quote: '"Can you prove this works for UK markets?"' },
      { text: 'Prospect: "Show me a UK SaaS company that did this."', classification: 'observed', callRef: 'Call #15', quote: '"Show me a UK SaaS company that did this."' },
    ],
    status: 'validated',
  },
  {
    id: 'risk_reversal',
    title: 'Risk Reversal',
    description: 'Zero retainer. You only pay for meetings that show up and fit your ideal customer profile (ICP).',
    evidence: [
      { text: 'Prospect: "We got burned by retainer agencies."', classification: 'observed', callRef: 'Call #4', quote: '"We got burned by retainer agencies."' },
      { text: 'Prospect: "What if the meetings are junk?"', classification: 'observed', callRef: 'Call #9', quote: '"What if the meetings are junk?"' },
      { text: 'Gap: Exact ICP filter criteria not yet stress-tested at scale.', classification: 'knowledge_gap', callRef: '—' },
    ],
    status: 'validated',
  },
  {
    id: 'price',
    title: 'Price',
    description: '£250 per qualified show-up meeting. No monthly lock-in, pause or cancel anytime.',
    evidence: [
      { text: 'Prospect pushback at £300 tested in calls #3, #7, #9.', classification: 'observed', callRef: 'Calls #3, #7, #9' },
      { text: '£250 sits below "agency retainer" mental anchor.', classification: 'hypothesis', callRef: 'Observed across 12 calls' },
    ],
    status: 'draft',
  },
  {
    id: 'next_step',
    title: 'Next Step',
    description: '10-minute ICP alignment audit to verify if your offer qualifies for the pay-per-meeting model.',
    evidence: [
      { text: 'High conversion CTA identified in closing sequence.', classification: 'observed', callRef: 'Calls #1, #6, #11' },
      { text: 'Gap: Optimal audit duration not A/B tested (10 vs 15 vs 20 min).', classification: 'knowledge_gap', callRef: '—' },
    ],
    status: 'draft',
  },
];

const CLASSIFICATION_LABELS: Record<EvidenceClassification, { label: string; color: string; bg: string }> = {
  observed: { label: 'Observed', color: 'var(--success)', bg: 'var(--success-muted)' },
  hypothesis: { label: 'Hypothesis', color: 'var(--warning)', bg: 'var(--warning-muted)' },
  knowledge_gap: { label: 'Knowledge Gap', color: 'var(--text-muted)', bg: 'var(--bg-surface-active)' },
};

export default function OfferFramework() {
  const [components, setComponents] = useState<OfferComponent[]>(INITIAL_COMPONENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', evidence: '' as string });
  const [newEvidence, setNewEvidence] = useState({ text: '', classification: 'observed' as EvidenceClassification, callRef: '', quote: '' });

  const handleEdit = (comp: OfferComponent) => {
    setEditingId(comp.id);
    setEditForm({ description: comp.description, evidence: comp.evidence.map(e => e.text).join('\n') });
  };

  const handleSave = (id: string) => {
    const evidenceItems = editForm.evidence.split('\n').filter(Boolean).map(text => ({
      text,
      classification: 'observed' as EvidenceClassification,
      callRef: '',
      quote: '',
    }));
    setComponents(prev =>
      prev.map(c => (c.id === id ? { ...c, description: editForm.description, evidence: evidenceItems, status: 'validated' as const } : c))
    );
    setEditingId(null);
  };

  const handleAddEvidence = (compId: string) => {
    if (!newEvidence.text.trim()) return;
    const item: EvidenceItem = {
      text: newEvidence.text,
      classification: newEvidence.classification,
      callRef: newEvidence.callRef,
      quote: newEvidence.quote,
    };
    setComponents(prev =>
      prev.map(c => (c.id === compId ? { ...c, evidence: [...c.evidence, item] } : c))
    );
    setNewEvidence({ text: '', classification: 'observed', callRef: '', quote: '' });
  };

  const handleRemoveEvidence = (compId: string, evidenceIndex: number) => {
    setComponents(prev =>
      prev.map(c => (c.id === compId ? { ...c, evidence: c.evidence.filter((_, i) => i !== evidenceIndex) } : c))
    );
  };

  const getEvidenceThresholdMet = (comp: OfferComponent) => {
    const observedCount = comp.evidence.filter(e => e.classification === 'observed').length;
    return observedCount >= 3;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Offer Framework & Structure</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Deconstruct your B2B cold calling offer into 5 core pillars. Evidence is classified as <strong>Observed</strong> (direct quotes), <strong>Hypothesis</strong> (inferred patterns), or <strong>Knowledge Gaps</strong> (missing data). Validation requires n≥3 Observed items.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {components.map((comp, index) => {
            const thresholdMet = getEvidenceThresholdMet(comp);
            return (
              <div
                key={comp.id}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-surface-active)',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      0{index + 1}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{comp.title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: comp.status === 'validated' ? 'var(--success-muted)' : 'var(--warning-muted)',
                      color: comp.status === 'validated' ? 'var(--success)' : 'var(--warning)',
                    }}>
                      {comp.status === 'validated' ? 'Validated' : 'Draft'}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: thresholdMet ? 'var(--success-muted)' : 'var(--warning-muted)',
                      color: thresholdMet ? 'var(--success)' : 'var(--warning)',
                      fontWeight: 500
                    }}>
                      n≥3 {thresholdMet ? 'Met' : 'Not Met'}
                    </span>
                    {editingId !== comp.id && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => handleEdit(comp)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {editingId === comp.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Evidence (one per line)</div>
                      <textarea
                        value={editForm.evidence}
                        onChange={e => setEditForm({ ...editForm, evidence: e.target.value })}
                        placeholder="Evidence citation..."
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          minHeight: '60px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleSave(comp.id)}
                      >
                        Save Pillar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5 }}>
                      {comp.description}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>Evidence Base:</span>
                        <span>{comp.evidence.filter(e => e.classification === 'observed').length} Observed · {comp.evidence.filter(e => e.classification === 'hypothesis').length} Hypothesis · {comp.evidence.filter(e => e.classification === 'knowledge_gap').length} Gaps</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {comp.evidence.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              padding: '10px',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              alignItems: 'flex-start'
                            }}
                          >
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: CLASSIFICATION_LABELS[item.classification].bg,
                              color: CLASSIFICATION_LABELS[item.classification].color,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}>
                              {CLASSIFICATION_LABELS[item.classification].label}
                            </span>
                            <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.4 }}>
                              <span style={{ color: 'var(--text-primary)' }}>{item.text}</span>
                              {item.callRef && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>
                                  [{item.callRef}]
                                </span>
                              )}
                              {item.quote && (
                                <blockquote style={{ margin: '4px 0 0', paddingLeft: '8px', borderLeft: '2px solid var(--accent-primary)', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  {item.quote}
                                </blockquote>
                              )}
                            </div>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '2px 8px', fontSize: '11px', alignSelf: 'flex-start' }}
                              onClick={() => handleRemoveEvidence(comp.id, i)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                          type="text"
                          value={newEvidence.text}
                          onChange={e => setNewEvidence({ ...newEvidence, text: e.target.value })}
                          placeholder="Add evidence (direct quote or observation)..."
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px'
                          }}
                        />
                        <select
                          value={newEvidence.classification}
                          onChange={e => setNewEvidence({ ...newEvidence, classification: e.target.value as EvidenceClassification })}
                          style={{
                            padding: '8px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px'
                          }}
                        >
                          <option value="observed">Observed</option>
                          <option value="hypothesis">Hypothesis</option>
                          <option value="knowledge_gap">Knowledge Gap</option>
                        </select>
                        <input
                          type="text"
                          value={newEvidence.callRef}
                          onChange={e => setNewEvidence({ ...newEvidence, callRef: e.target.value })}
                          placeholder="Call ref (e.g. Call #3)"
                          style={{
                            width: '140px',
                            padding: '8px 10px',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px'
                          }}
                        />
                        <button
                          className="btn btn-primary"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => handleAddEvidence(comp.id)}
                          disabled={!newEvidence.text.trim()}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
