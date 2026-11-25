import React, { useState, useEffect, useRef, useCallback } from 'react';

type Speaker = 'Me' | 'Prospect' | 'Unknown';
type CapturePhase = 'idle' | 'requesting' | 'recording' | 'stopping';

interface TranscriptSegment {
  speaker: Speaker;
  start: number;
  end: number;
  text: string;
  rms: number;
}

interface AudioRecording {
  blob: Blob;
  mimeType: string;
  name: string;
  source: 'recording' | 'upload';
  duration: number;
  segments: TranscriptSegment[];
}

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'audio/mp4',
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function newRequestId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export default function Capture() {
  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState<AudioRecording | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [consent, setConsent] = useState(false);
  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionRef = useRef(0);
  const startedAtRef = useRef(0);
  const segmentsRef = useRef<TranscriptSegment[]>([]);
  const currentSegmentRef = useRef<{ speaker: Speaker; start: number; text: string; rmsSum: number; rmsCount: number } | null>(null);
  const lastVoiceActivityRef = useRef<Speaker>('Unknown');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== 'inactive') {
          try { recorder.stop(); } catch {}
        }
      }
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      processorRef.current?.disconnect();
      processorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'recording') return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!audio) { setAudioUrl(null); return; }
    const url = URL.createObjectURL(audio.blob);
    setAudioUrl(url);
    setPreviewError(false);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  const busy = false;
  const captureActive = phase !== 'idle';
  const canSave = Boolean(title.trim() && audio && consent && !captureActive && !busy);

  async function startRecording() {
    if (captureActive || busy) return;
    setError(null);
    if (!consent) {
      setError('Confirm that you have obtained the required consent before starting the recording.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording isn\'t available in this browser. Use a secure connection in a supported browser, or upload a recording instead.');
      return;
    }

    const session = ++sessionRef.current;
    setPhase('requesting');
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (session !== sessionRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      segmentsRef.current = [];
      currentSegmentRef.current = null;
      lastVoiceActivityRef.current = 'Unknown';

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        const now = (Date.now() - startedAtRef.current) / 1000;

        let speaker: Speaker;
        if (rms > 0.05) speaker = 'Me';
        else if (rms > 0.015) speaker = 'Prospect';
        else speaker = 'Unknown';

        if (speaker !== lastVoiceActivityRef.current && speaker !== 'Unknown') {
          if (currentSegmentRef.current) {
            const prev = currentSegmentRef.current;
            segmentsRef.current.push({
              speaker: prev.speaker,
              start: prev.start,
              end: now,
              text: prev.text,
              rms: prev.rmsSum / Math.max(1, prev.rmsCount),
            });
          }
          currentSegmentRef.current = { speaker, start: now, text: '', rmsSum: rms, rmsCount: 1 };
          lastVoiceActivityRef.current = speaker;
        } else if (currentSegmentRef.current && speaker === currentSegmentRef.current.speaker) {
          currentSegmentRef.current.rmsSum += rms;
          currentSegmentRef.current.rmsCount += 1;
        }
      };

      source.connect(processor);

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      const preferredType = typeof MediaRecorder.isTypeSupported === 'function'
        ? preferredTypes.find(t => MediaRecorder.isTypeSupported(t))
        : undefined;
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      chunksRef.current = [];
      let size = 0;
      let tooLarge = false;
      let failed = false;

      recorder.ondataavailable = (e) => {
        if (session !== sessionRef.current || !e.data.size) return;
        size += e.data.size;
        if (size > MAX_AUDIO_BYTES) {
          tooLarge = true;
          if (recorder.state !== 'inactive') {
            setPhase('stopping');
            recorder.stop();
          }
          return;
        }
        chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        if (session !== sessionRef.current) return;
        failed = true;
        setError('The recording stopped unexpectedly. Please check your microphone and try again.');
        if (recorder.state !== 'inactive') {
          try { recorder.stop(); } catch {
            streamRef.current?.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            recorderRef.current = null;
            audioContextRef.current?.close();
            audioContextRef.current = null;
            processorRef.current?.disconnect();
            processorRef.current = null;
            setPhase('idle');
          }
        } else {
          streamRef.current?.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          recorderRef.current = null;
          audioContextRef.current?.close();
          audioContextRef.current = null;
          processorRef.current?.disconnect();
          processorRef.current = null;
          setPhase('idle');
          if (chunksRef.current.length) {
            const mimeType = recorder.mimeType || chunksRef.current[0].type || 'application/octet-stream';
            finalizeRecording(new Blob(chunksRef.current, { type: mimeType }), mimeType, tooLarge, failed);
          }
        }
      };

      recorder.onstop = () => {
        if (session !== sessionRef.current) return;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
        processorRef.current?.disconnect();
        processorRef.current = null;
        setPhase('idle');
        const mimeType = recorder.mimeType || chunksRef.current.find(c => c.type)?.type || 'application/octet-stream';
        finalizeRecording(new Blob(chunksRef.current, { type: mimeType }), mimeType, tooLarge, failed);
      };

      recorder.start(1000);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase('recording');

    } catch (caught) {
      stream?.getTracks().forEach(t => t.stop());
      if (session !== sessionRef.current) return;
      streamRef.current = null;
      recorderRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      processorRef.current?.disconnect();
      processorRef.current = null;
      setPhase('idle');
      setError(microphoneError(caught));
    }
  }

  function finalizeRecording(blob: Blob, mimeType: string, tooLarge: boolean, failed: boolean) {
    if (!blob.size) {
      setError(tooLarge
        ? 'The recording reached the 20 MiB limit before audio could be saved. Please make a shorter recording.'
        : 'No audio was captured. Check your microphone and try again.');
      return;
    }

    if (currentSegmentRef.current) {
      const prev = currentSegmentRef.current;
      segmentsRef.current.push({
        speaker: prev.speaker,
        start: prev.start,
        end: (Date.now() - startedAtRef.current) / 1000,
        text: prev.text,
        rms: prev.rmsSum / Math.max(1, prev.rmsCount),
      });
      currentSegmentRef.current = null;
    }

    const name = failed || tooLarge ? 'Partial recording' : 'Your recording';
    setAudio({
      blob,
      mimeType,
      name,
      source: 'recording',
      duration: (Date.now() - startedAtRef.current) / 1000,
      segments: segmentsRef.current,
    });
    setError(
      tooLarge
        ? 'The 20 MiB limit was reached, so recording stopped. The captured audio may be incomplete; review it before saving.'
        : failed
        ? 'Recording stopped unexpectedly. The captured audio may be incomplete; review it before saving.'
        : null
    );
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    setPhase('stopping');
    try { recorder.stop(); } catch {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      recorderRef.current = null;
      audioContextRef.current?.close();
      audioContextRef.current = null;
      processorRef.current?.disconnect();
      processorRef.current = null;
      setPhase('idle');
      setError('We couldn\'t finish this recording. Please try again.');
    }
  }

  function chooseFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_AUDIO_BYTES) {
      setError('This file is larger than 20 MiB. Choose a smaller recording and try again.');
      return;
    }
    if (!file.size) {
      setError('This file is empty. Choose a recording with audio.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const normalizedType = file.type.toLowerCase().split(';')[0];
    if (!MIME_BY_EXTENSION[ext] && !Object.values(MIME_BY_EXTENSION).includes(normalizedType)) {
      setError('Choose a WebM, MP3, WAV, OGG, M4A, or MP4 audio file.');
      return;
    }
    const mimeType = Object.values(MIME_BY_EXTENSION).includes(normalizedType) ? file.type : MIME_BY_EXTENSION[ext];
    setAudio({ blob: file, mimeType, name: file.name, source: 'upload', duration: 0, segments: [] });
  }

  const handleSave = useCallback(async () => {
    if (!canSave || !audio) return;
    setError(null);
    console.log('Saving call:', { title, company, audio });
    setTitle('');
    setCompany('');
    setConsent(false);
    setAudio(null);
    alert('Call saved! (In production, this would upload to your backend)');
  }, [canSave, audio, title, company]);

  return (
    <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '16px' }}>Capture Session</h2>

      {error && (
        <div style={{ color: 'var(--danger)', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--danger-muted)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="capture-fields" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="capture-field">
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Call title <span style={{ color: 'var(--danger)' }}> *</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Discovery call with Alex"
              required
              disabled={busy || captureActive}
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
              }}
            />
          </div>
          <div className="capture-field">
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
              Company <span style={{ color: 'var(--text-muted)' }}>Optional</span>
            </label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Acme Studio"
              disabled={busy || captureActive}
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span style={{ marginTop: '2px' }}>ℹ</span>
          <div>
            <strong>A note about phone calls</strong><br />
            A browser microphone may not capture both sides of a call on the same device.
            Use speakerphone on another device or upload a recording.
            Obtain any required consent from everyone before recording or uploading.
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            disabled={busy || captureActive}
            required
            style={{ marginTop: '2px', accentColor: 'var(--accent-primary)' }}
          />
          <span>I confirm that I have obtained all required consent to record and upload this conversation.</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Audio</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Up to 20 MiB</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className={mode === 'record' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => { setMode('record'); setError(null); }}
              disabled={captureActive || busy}
              style={{ flex: 1 }}
            >
              🎙 Record audio
            </button>
            <button
              type="button"
              className={mode === 'upload' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => { setMode('upload'); setError(null); }}
              disabled={captureActive || busy}
              style={{ flex: 1 }}
            >
              📁 Upload file
            </button>
          </div>

          {mode === 'record' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
              <div className={`capture-source-icon ${phase === 'recording' ? 'is-recording' : ''}`} style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: phase === 'recording' ? 'var(--danger-muted)' : 'var(--bg-surface)',
                border: `2px solid ${phase === 'recording' ? 'var(--danger)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px' }}>🎙</span>
              </div>

              {phase === 'recording' || phase === 'stopping' ? (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      {phase === 'stopping' ? 'Finishing recording...' : 'Recording in progress'}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                      {formatTime(elapsed)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={phase === 'stopping' ? 'btn btn-secondary' : 'btn btn-danger'}
                    onClick={stopRecording}
                    disabled={phase === 'stopping'}
                    style={{ padding: '10px 24px', fontSize: '14px', minWidth: '160px' }}
                  >
                    {phase === 'stopping' ? 'Finishing...' : 'Stop recording'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>Ready when you are</div>
                    <div style={{ fontSize: '14px' }}>Use your microphone to capture the conversation.</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={startRecording}
                    disabled={phase === 'requesting' || busy}
                    style={{ padding: '12px 28px', fontSize: '15px', minWidth: '200px' }}
                  >
                    {phase === 'requesting'
                      ? <>⟳ Waiting for microphone...</>
                      : audio
                      ? 'Record new audio'
                      : 'Start recording'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>📁</span>
              </div>
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>Have a recording already?</div>
                <div style={{ fontSize: '14px' }}>Choose a WebM, MP3, WAV, OGG, M4A, or MP4 file.</div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".webm,.mp3,.wav,.ogg,.m4a,.mp4,audio/webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4,video/mp4"
                onChange={e => { chooseFile(e.target.files?.[0]); if (e.target) e.target.value = ''; }}
                disabled={busy}
                tabIndex={-1}
                style={{ display: 'none' }}
              />
              <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={busy} style={{ padding: '12px 28px', fontSize: '15px', minWidth: '200px' }}>
                📁 Choose file
              </button>
            </div>
          )}
        </div>

        {audio && audioUrl && (
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🎵</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{audio.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {audio.source === 'recording' ? 'Recording ready' : 'File selected'} · {(audio.blob.size / (1024 * 1024)).toFixed(2)} MiB · {formatTime(audio.duration)}
                  </div>
                </div>
              </div>
              <audio
                className="capture-player"
                controls
                src={audioUrl}
                onError={() => setPreviewError(true)}
                style={{ width: '100%', height: '40px' }}
              />
              {previewError && <p style={{ color: 'var(--warning)', fontSize: '12px', marginTop: '8px' }}>Your browser couldn't play this preview. You can still save this audio.</p>}
              {audio.segments.length > 0 && (
                <details style={{ marginTop: '16px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--accent-primary)' }}>
                    Transcript Segments ({audio.segments.length})
                  </summary>
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                    {audio.segments.map((seg, i) => (
                      <div key={i} style={{
                        padding: '10px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start'
                      }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: seg.speaker === 'Me' ? 'var(--accent-muted)' : seg.speaker === 'Prospect' ? 'var(--success-muted)' : 'var(--bg-surface-active)',
                          color: seg.speaker === 'Me' ? 'var(--accent-primary)' : seg.speaker === 'Prospect' ? 'var(--success)' : 'var(--text-muted)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          minWidth: '80px',
                          textAlign: 'center'
                        }}>
                          {seg.speaker}
                        </span>
                        <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.4 }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginRight: '8px' }}>
                            {formatTime(seg.start)} – {formatTime(seg.end)}
                          </span>
                          <span style={{ color: 'var(--text-primary)' }}>{seg.text || '(no speech detected)'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>
                            RMS: {seg.rms.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✓ Consent matters · Recording and upload require consent</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setTitle(''); setCompany(''); setConsent(false); setAudio(null); setError(null); setPhase('idle'); }} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!canSave} style={{ padding: '10px 20px', fontSize: '14px' }}>
              Save call →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function microphoneError(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Microphone access was denied. Allow microphone access in your browser settings and try again, or upload a recording instead.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was found. Connect a microphone and try again, or upload a recording instead.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your microphone is unavailable or in use by another app. Check your microphone and try again.';
  }
  if (name === 'SecurityError') {
    return 'Microphone access is blocked here. Use a secure connection and check your browser permissions.';
  }
  return 'We couldn\'t start the microphone. Check your browser permissions and try again, or upload a recording instead.';
}