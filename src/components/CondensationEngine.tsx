import { useState } from 'react';

type EvidenceClassification = 'observed' | 'strongly_inferred' | 'hypothesis' | 'recommendation';

interface EvidenceItem {
  claim: string;
  evidence: { quote: string; callNumber?: number; company?: string | null }[];
  confidence: EvidenceClassification;
}

interface OfferVersion {
  version: string;
  date: string;
  headline: string;
  summary: string;
  changes: string[];
  rationale: string;
  repeatedPatterns: EvidenceItem[];
  hypotheses: EvidenceItem[];
  experiments: { test: string; measure: string; evidence: string[] }[];
  knowledgeGaps: string[];
  status: 'active' | 'archived' | 'draft';
  wordCount: number;
}

const INITIAL_VERSIONS: OfferVersion[] = [
  {
    version: 'v3.2 (Current)',
    date: '2026-11-20',
    headline: 'Book 15 qualified B2B sales meetings/mo on pay-per-meeting with zero risk.',
    summary: 'A tighter promise that removes hiring friction and financial risk for UK B2B teams needing predictable pipeline.',
    changes: [
      'Lead with the outcome: 15 qualified meetings/month on pay-per-meeting.',
      'Show how your process works with their existing CRM — no replacement needed.',
      'Make the setup time and effort concrete: 10-minute ICP audit.',
    ],
    rationale: '12 analyzed calls repeatedly mention manual follow-up, existing tools, and desire for more booked conversations. Pay-per-meeting directly neutralizes retainer objections (n=12). Price anchor at £250 sits below agency retainer mental model.',
    repeatedPatterns: [
      {
        claim: 'Prospects want qualified meetings, not leads or activity.',
        confidence: 'observed',
        evidence: [
          { quote: '"We need more qualified meetings, not more leads."', callNumber: 3, company: 'Meridian Creative' },
          { quote: '"Activity metrics don\'t pay my team\'s salaries."', callNumber: 7, company: 'Northstar Studio' },
          { quote: '"If you can guarantee show-ups, that changes things."', callNumber: 11, company: 'The Goodwell Co.' },
        ],
      },
      {
        claim: 'Existing CRM/tool stack is a friction point — they want add-on, not replacement.',
        confidence: 'strongly_inferred',
        evidence: [
          { quote: '"We need fewer tools, not another complicated thing."', callNumber: 4, company: 'Fieldwork Agency' },
          { quote: '"Already using a CRM — does this integrate?"', callNumber: 14, company: 'ScaleOps' },
        ],
      },
    ],
    hypotheses: [
      {
        claim: 'A concrete setup promise (10 min) reduces hesitation more than vague "easy setup".',
        confidence: 'hypothesis',
        evidence: [
          { quote: '"I just need something my team can actually keep up with."', callNumber: 2, company: 'Northstar Studio' },
        ],
      },
      {
        claim: '£250/meeting sits below the "agency retainer" anchor for 60% of prospects.',
        confidence: 'hypothesis',
        evidence: [
          { quote: '"£300/meeting is steep for our budget."', callNumber: 9, company: 'GrowthLabs' },
        ],
      },
    ],
    experiments: [
      {
        test: 'Show "works with your CRM" message in next 20 conversations.',
        measure: 'Track objection rate on "Already using a tool" and requests for proof.',
        evidence: ['Already using a CRM (n=12)', 'Integration questions (n=4)'],
      },
      {
        test: 'A/B test 10-min vs 15-min vs 20-min ICP audit framing.',
        measure: 'Conversion rate from audit to qualified meeting.',
        evidence: ['Setup friction mentioned in 8 calls'],
      },
    ],
    knowledgeGaps: [
      'Which specific proof point (case study metric) makes the value credible to buyers?',
      'Optimal ICP audit duration not yet A/B tested.',
      'Whether "pay only for show-ups" creates quality concerns at scale.',
    ],
    status: 'active',
    wordCount: 38,
  },
  {
    version: 'v2.1',
    date: '2026-11-10',
    headline: 'We help UK B2B companies book predictable sales meetings without hiring full-time SDRs.',
    summary: 'Performance-aligned outbound that delivers qualified meetings, not just activity.',
    changes: [
      'Shift from "agency" framing to "system" framing.',
      'Introduce pay-per-meeting as primary model.',
      'Add UK market specificity.',
    ],
    rationale: 'Initial 5 competitor objection clusters showed "agency" label triggered retainer comparisons. Pay-per-meeting differentiation needed.',
    repeatedPatterns: [
      {
        claim: 'Retainer model is the primary friction point for prospects with agency experience.',
        confidence: 'observed',
        evidence: [
          { quote: '"We got burned by retainer agencies."', callNumber: 1, company: 'TechFlow' },
          { quote: '"£2,500/month regardless of results?"', callNumber: 3, company: 'GrowthLabs' },
        ],
      },
    ],
    hypotheses: [
      {
        claim: 'Performance pricing alone may not overcome trust gap without proof.',
        confidence: 'hypothesis',
        evidence: [
          { quote: '"What if the meetings are junk?"', callNumber: 2, company: 'ScaleOps' },
        ],
      },
    ],
    experiments: [
      { test: 'Add case study to deck.', measure: 'Track "proof" objection frequency.', evidence: ['Needs to see proof of ROI (n=3)'] },
    ],
    knowledgeGaps: ['Which case study metrics resonate most?'],
    status: 'archived',
    wordCount: 54,
  },
  {
    version: 'v1.0 (Initial Draft)',
    date: '2026-11-01',
    headline: 'Full-service outbound lead generation agency for UK B2B startups.',
    summary: 'We handle cold email and cold calling end-to-end so you don\'t have to hire SDRs.',
    changes: [],
    rationale: 'Founder intuition / pre-call hypotheses. No call evidence yet.',
    repeatedPatterns: [],
    hypotheses: [
      {
        claim: 'Startups need full-service outbound.',
        confidence: 'hypothesis',
        evidence: [],
      },
      {
        claim: 'Retainer pricing is acceptable for this market.',
        confidence: 'hypothesis',
        evidence: [],
      },
    ],
    experiments: [],
    knowledgeGaps: [
      'Do prospects actually want full-service or just meetings?',
      'Is retainer pricing a blocker?',
      'What proof do buyers need?',
    ],
    status: 'archived',
    wordCount: 42,
  },
];

const CLASSIFICATION_LABELS: Record<EvidenceClassification, { label: string; color: string; bg: string }> = {
  observed: { label: 'Observed', color: 'var(--success)', bg: 'var(--success-muted)' },
  strongly_inferred: { label: 'Strongly Inferred', color: 'var(--accent-primary)', bg: 'var(--accent-muted)' },
  hypothesis: { label: 'Hypothesis', color: 'var(--warning)', bg: 'var(--warning-muted)' },
  recommendation: { label: 'Recommendation', color: 'var(--text-secondary)', bg: 'var(--bg-surface-active)' },
};

export default function CondensationEngine() {
  const [versions, setVersions] = useState<OfferVersion[]>(INITIAL_VERSIONS);
  const [condensing, setCondensing] = useState(false);
  const [showNewDraft, setShowNewDraft] = useState(false);
  const [newDraft, setNewDraft] = useState({
    headline: 'Book 15 qualified B2B meetings/mo on pay-per-meeting with zero risk.',
    summary: 'A tighter promise that removes hiring friction and financial risk for UK B2B teams needing predictable pipeline.',
    changes: [
      'Lead with the outcome: 15 qualified meetings/month on pay-per-meeting.',
      'Show how your process works with their existing CRM — no replacement needed.',
      'Make the setup time and effort concrete: 10-minute ICP audit.',
    ].join('\n'),
    rationale: 'Based on 12 analyzed calls...',
  });

  const handleGenerateCondensation = () => {
    setCondensing(true);
    setTimeout(() => {
      const activeVersion = versions.find(v => v.status === 'active');
      const nextVersionNum = activeVersion ? parseFloat(activeVersion.version.match(/v(\d+\.\d+)/)?.[1] || '3.2') + 0.1 : 3.3;
      const newVer: OfferVersion = {
        version: `v${nextVersionNum.toFixed(1)} (Condensed)`,
        date: new Date().toISOString().split('T')[0],
        headline: newDraft.headline,
        summary: newDraft.summary,
        changes: newDraft.changes.split('\n').filter(Boolean),
        rationale: newDraft.rationale,
        repeatedPatterns: [],
        hypotheses: [],
        experiments: [],
        knowledgeGaps: [],
        status: 'draft',
        wordCount: newDraft.headline.split(' ').length + newDraft.summary.split(' ').length,
      };
      setVersions([newVer, ...versions]);
      setCondensing(false);
      setShowNewDraft(false);
    }, 1000);
  };

  const handleActivateVersion = (version: string) => {
    setVersions(prev => prev.map(v => ({
      ...v,
      status: v.version === version ? 'active' : v.status === 'active' ? 'archived' : v.status,
    })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Condensation Engine</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Iteratively compress the offer based on validated call evidence. Separates <strong>Observed</strong> (direct quotes), <strong>Strongly Inferred</strong> (pattern-backed), <strong>Hypothesis</strong> (needs testing), and <strong>Knowledge Gaps</strong> (missing data).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '13px' }}
              onClick={() => setShowNewDraft(!showNewDraft)}
            >
              {showNewDraft ? 'Hide Draft' : 'New Condensation Draft'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleGenerateCondensation}
              disabled={condensing || !showNewDraft}
              style={{ fontSize: '13px' }}
            >
              {condensing ? 'Condensing...' : 'Generate Version'}
            </button>
          </div>
        </div>

        {showNewDraft && (
          <div style={{
            padding: '16px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              New Condensation Draft
            </div>
            <input
              type="text"
              value={newDraft.headline}
              onChange={e => setNewDraft({ ...newDraft, headline: e.target.value })}
              placeholder="Condensed headline (one sentence)..."
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-focus)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '15px',
                fontWeight: 500,
              }}
            />
            <textarea
              value={newDraft.summary}
              onChange={e => setNewDraft({ ...newDraft, summary: e.target.value })}
              placeholder="One-paragraph summary of the condensed offer..."
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '60px'
              }}
            />
            <textarea
              value={newDraft.changes}
              onChange={e => setNewDraft({ ...newDraft, changes: e.target.value })}
              placeholder="Key changes from previous version (one per line)..."
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '70px'
              }}
            />
            <textarea
              value={newDraft.rationale}
              onChange={e => setNewDraft({ ...newDraft, rationale: e.target.value })}
              placeholder="Rationale: what evidence supports this direction? (cite call numbers, objection counts, response variants)..."
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '70px'
              }}
            />
          </div>
        )}

        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)' }}>
            Condensation Progress
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Original v1 Word Count</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>42 words</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Active Word Count</div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--success)' }}>
                {(() => {
                  const active = versions.find(v => v.status === 'active');
                  return active ? `${active.wordCount} words (${((1 - active.wordCount / 42) * 100).toFixed(1)}% reduction)` : '—';
                })()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Versions</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>{versions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Evidence Threshold</div>
              <div style={{ fontSize: '20px', fontWeight: 600 }}>n ≥ 3</div>
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Version History & Intelligence</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {versions.map((ver, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: ver.status === 'active' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{ver.version}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ver.date}</span>
                  {ver.status === 'active' && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--success-muted)',
                      color: 'var(--success)',
                      fontWeight: 600
                    }}>ACTIVE</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ver.wordCount} words</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: ver.status === 'active' ? 'var(--success-muted)' : ver.status === 'draft' ? 'var(--warning-muted)' : 'var(--bg-surface)',
                    color: ver.status === 'active' ? 'var(--success)' : ver.status === 'draft' ? 'var(--warning)' : 'var(--text-secondary)',
                    fontWeight: 500
                  }}>
                    {ver.status.toUpperCase()}
                  </span>
                  {ver.status !== 'active' && (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => handleActivateVersion(ver.version)}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
                fontSize: '13px',
                padding: '12px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Headline:</span>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '4px' }}>{ver.headline}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Summary:</span>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{ver.summary}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>Key Changes:</div>
                <ol style={{ marginLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {ver.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ol>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>Rationale:</span> {ver.rationale}
              </div>

              {ver.repeatedPatterns.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                    Observed Repeated Patterns (n≥3 Direct Evidence)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ver.repeatedPatterns.map((item, i) => (
                      <div key={i} style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{item.claim}</strong>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: CLASSIFICATION_LABELS[item.confidence].bg,
                            color: CLASSIFICATION_LABELS[item.confidence].color,
                            fontWeight: 600
                          }}>
                            {CLASSIFICATION_LABELS[item.confidence].label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.evidence.map((ev, j) => (
                            <blockquote key={j} style={{ margin: 0, paddingLeft: '10px', borderLeft: '2px solid var(--success)', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              "{ev.quote}" <cite style={{ color: 'var(--text-muted)' }}>{ev.company ? `— ${ev.company}` : ''}{ev.callNumber ? ` · Call ${ev.callNumber}` : ''}</cite>
                            </blockquote>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ver.hypotheses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning)' }}>
                    Hypotheses / Uncertainties (Needs Testing)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {ver.hypotheses.map((item, i) => (
                      <div key={i} style={{ padding: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--warning-muted)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{item.claim}</strong>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor: CLASSIFICATION_LABELS[item.confidence].bg,
                            color: CLASSIFICATION_LABELS[item.confidence].color,
                            fontWeight: 600
                          }}>
                            {CLASSIFICATION_LABELS[item.confidence].label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.evidence.map((ev, j) => (
                            <blockquote key={j} style={{ margin: 0, paddingLeft: '10px', borderLeft: '2px solid var(--warning)', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              "{ev.quote}" <cite style={{ color: 'var(--text-muted)' }}>{ev.company ? `— ${ev.company}` : ''}{ev.callNumber ? ` · Call ${ev.callNumber}` : ''}</cite>
                            </blockquote>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ver.experiments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    Next Experiments / Tests
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ver.experiments.map((exp, i) => (
                      <div key={i} style={{ padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{exp.test}</strong>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}><b>Measure:</b> {exp.measure}</p>
                        {exp.evidence.length > 0 && (
                          <small style={{ color: 'var(--text-muted)' }}>Grounded in: {exp.evidence.join(' · ')}</small>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ver.knowledgeGaps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    What We Still Don't Know (Knowledge Gaps)
                  </div>
                  <ul style={{ marginLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {ver.knowledgeGaps.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
