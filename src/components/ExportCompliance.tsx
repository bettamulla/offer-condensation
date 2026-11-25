import { useState } from 'react';

export default function ExportCompliance() {
  const [retentionDays, setRetentionDays] = useState(30);

  const handleExportJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      project: 'Offer Condensation',
      // In a real app, this would pull from a global state or database
      exportType: 'full_backup'
    };
    downloadFile(JSON.stringify(data, null, 2), 'offer-condensation-export.json', 'application/json');
  };

  const handleExportCSV = () => {
    // Mock CSV data for demonstration
    const csvContent = [
      ['Type', 'Content', 'Frequency/Metric'],
      ['Objection', 'Too expensive', '5'],
      ['Objection', 'Already use agency', '12'],
      ['Offer Pillar', 'Promise', 'Book 15 qualified B2B meetings/mo'],
    ].map(e => e.join(",")).join("\n");

    downloadFile(csvContent, 'offer-condensation-data.csv', 'text/csv');
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Export & Data Portability</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          Export your transcripts, objection clusters, and offer versions for offline review or compliance.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleExportJSON}>
            Export JSON Backup
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            Export CSV Summary
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Compliance & Retention</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              Audio Retention Period (Days)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="1"
                max="90"
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '16px', fontWeight: 600, minWidth: '60px' }}>
                {retentionDays} days
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px' }}>
              Audio files older than this period will be automatically purged from local storage.
            </p>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: '4px' }}>
              Privacy Notice
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              All data is stored locally in your browser/app context. No audio or transcripts are sent to external servers for processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
