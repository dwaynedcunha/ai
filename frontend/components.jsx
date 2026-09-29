import { useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  CloudUpload,
  Cpu,
  Crop,
  Download,
  FileImage,
  ImagePlus,
  Layers3,
  ScanLine,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

export function Navbar() {
  const links = [['Dashboard', '#dashboard'], ['Detection', '#detection'], ['How it works', '#how-it-works'], ['Results', '#results'], ['About', '#about']]
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#dashboard" aria-label="ANPR Vision home">
          <span className="brand-icon"><ScanLine size={20} strokeWidth={2.2} /></span>
          <span className="brand-name">ANPR<span>Vision</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
        </nav>
        <a className="nav-cta" href="#detection">Open workspace <ArrowUpRight size={15} /></a>
      </div>
    </header>
  )
}

export function Hero({ onDetect }) {
  return (
    <section className="hero section-wrap" id="dashboard">
      <div className="hero-copy">
        <span className="prototype-badge"><span /> FRONTEND RESEARCH PROTOTYPE</span>
        <h1>Automatic number plate <span>recognition</span></h1>
        <p>Explore an AI-inspired computer vision workflow, from vehicle image to recognized registration number.</p>
        <div className="hero-actions">
          <button className="button-primary" onClick={onDetect}>Try detection <ArrowRight size={17} /></button>
          <a className="button-quiet" href="#methodology">View methodology <ArrowDown size={16} /></a>
        </div>
        <div className="hero-meta"><span><span className="meta-check"><Check size={11} /></span> Browser-based demo</span><i /> <span>No live AI model</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustration of the simulated recognition workflow">
        <div className="visual-topline"><span><span className="mini-live" /> LIVE PREVIEW</span><span>DEMO 01 / 04</span></div>
        <div className="visual-photo">
          <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=85" alt="Silver vehicle in an urban setting" />
          <div className="hero-scan-line" />
          <div className="hero-detection-box"><span className="corner-label">PLATE REGION</span></div>
          <div className="visual-coordinate">X: 54.2&nbsp;&nbsp; Y: 68.7</div>
          <div className="visual-plate"><span className="plate-label">OCR OUTPUT</span><strong>MH 43 AB 1234</strong><span className="plate-mark"><Check size={12} /></span></div>
        </div>
        <div className="visual-flow">
          <span className="flow-node"><ImagePlus size={15} /> Vehicle image</span><ArrowRight size={15} />
          <span className="flow-node"><ScanLine size={15} /> Plate detection</span><ArrowRight size={15} />
          <span className="flow-node"><span className="flow-text-icon">Aa</span> OCR</span>
        </div>
      </div>
      <div className="hero-index"><span>01</span> / INTRODUCTION</div>
    </section>
  )
}

export function ImageUploader({ onFile }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  function acceptFiles(files) {
    const file = files?.[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }
  return (
    <div
      className={`upload-dropzone ${isDragging ? 'drop-active' : ''}`}
      onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => { event.preventDefault(); setIsDragging(false); acceptFiles(event.dataTransfer.files) }}
    >
      <input ref={inputRef} type="file" accept="image/*" className="visually-hidden" aria-label="Choose a vehicle image" onChange={(event) => { acceptFiles(event.target.files); event.target.value = '' }} />
      <span className="upload-icon"><CloudUpload size={23} /></span>
      <strong>Drop a vehicle image here</strong>
      <span className="upload-or">or</span>
      <button className="button-outline upload-button" onClick={() => inputRef.current?.click()}><Upload size={15} /> Browse files</button>
      <small>JPG, PNG or WEBP · Up to 20 MB</small>
    </div>
  )
}

export function DetectionPanel({ image, result, processingStep, isProcessing, steps, onFile, onClear, onRun }) {
  return (
    <>
      <div className="preview-grid">
        <ImagePreview image={image} onFile={onFile} onClear={onClear} />
        <div className="preview-card detection-preview-card">
          <div className="preview-card-header">
            <div><span className="preview-overline">STAGE 03</span><h3>Detection preview</h3></div>
            <span className={`preview-state ${result ? 'state-detected' : isProcessing ? 'state-working' : ''}`}><i />{result ? 'Detected' : isProcessing ? 'Scanning' : 'Awaiting input'}</span>
          </div>
          <div className={`preview-image-area detection-image-area ${image ? 'has-image' : ''}`}>
            {image ? (
              <>
                <img src={image.url} alt={`Detection preview of ${image.name}`} />
                <div className={`bounding-box ${isProcessing || result ? 'box-active' : ''}`}>
                  <span className="bbox-label">PLATE · {result?.confidence || '--'}%</span>
                </div>
                {(isProcessing || result) && <div className={`scan-sweep ${isProcessing ? 'sweep-running' : ''}`} />}
                {result && <div className="detection-chip"><CircleCheck size={13} /> Region localized</div>}
              </>
            ) : (
              <div className="preview-placeholder"><span className="placeholder-icon"><ScanLine size={27} /></span><strong>Detection area</strong><span>Plate localization appears here</span><div className="placeholder-corners" /></div>
            )}
            <div className="image-coordinate">{image ? 'FRAME 01 · 1280 × 720' : 'AWAITING IMAGE INPUT'}</div>
          </div>
          <div className="preview-card-footer"><span><span className="legend-square" /> Simulated plate boundary</span><span>Not a live model</span></div>
        </div>
      </div>

      <ProcessingPipeline compact activeStep={isProcessing ? processingStep : result ? 5 : -1} />

      <div className="run-bar">
        <div className="run-note">{isProcessing ? <span className="button-spinner run-spinner" /> : <Sparkles size={16} />}<span>{isProcessing ? steps[processingStep] || 'Preparing image...' : 'Client-side simulation'}<small>{isProcessing ? `Simulated processing step ${Math.max(processingStep + 1, 1)} of ${steps.length}` : 'No image leaves your browser'}</small></span></div>
        <div className="run-actions">
          {image && <button className="icon-button clear-image" onClick={onClear} aria-label="Clear image" title="Clear image"><Trash2 size={16} /></button>}
          {image && <button className="button-primary run-button" onClick={onRun} disabled={isProcessing}>{isProcessing ? <><span className="button-spinner" /> Processing</> : result ? <>Run again <ArrowRight size={16} /></> : <>Run detection <ArrowRight size={16} /> </>}</button>}
          {!image && <span className="run-empty-hint">Add an image to begin <ArrowRight size={14} /></span>}
        </div>
      </div>
    </>
  )
}

function ImagePreview({ image, onFile, onClear }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  function acceptFiles(files) {
    const file = files?.[0]
    if (file?.type.startsWith('image/')) onFile(file)
  }
  return (
    <div className="preview-card original-card" onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); acceptFiles(event.dataTransfer.files) }}>
      <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" aria-label="Replace vehicle image" onChange={(event) => { acceptFiles(event.target.files); event.target.value = '' }} />
      <div className="preview-card-header"><div><span className="preview-overline">STAGE 01</span><h3>Original vehicle image</h3></div>{image && <span className="image-file-label"><FileImage size={13} /> {image.name}</span>}</div>
      <div className={`preview-image-area original-image-area ${isDragging ? 'drop-active' : ''} ${image ? 'has-image' : ''}`}>
        {image ? <><img src={image.url} alt={`Original vehicle image: ${image.name}`} /><span className="original-image-tag"><Check size={12} /> Input image</span></> : <ImageUploader onFile={onFile} />}
        {image && <div className="image-coordinate">SOURCE IMAGE</div>}
      </div>
      <div className="preview-card-footer original-footer">
        {image ? <><button className="text-action" onClick={() => inputRef.current?.click()}><ImagePlus size={14} /> Replace image</button><button className="text-action muted-action" onClick={onClear}><X size={14} /> Remove</button></> : <span><span className="legend-square legend-blue" /> Original input</span>}
        <span>STAGE 01 / 06</span>
      </div>
    </div>
  )
}

export function ProcessingPipeline({ compact = false, activeStep = -1 }) {
  const steps = [
    { title: 'Input image', icon: ImagePlus, description: 'Vehicle image captured or uploaded.' },
    { title: 'Preprocessing', icon: Layers3, description: 'Grayscale conversion and noise reduction.' },
    { title: 'Plate detection', icon: ScanLine, description: 'Localize the number plate region.' },
    { title: 'Plate cropping', icon: Crop, description: 'Isolate the detected plate area.' },
    { title: 'OCR recognition', icon: Cpu, description: 'Convert plate characters to text.' },
    { title: 'Final result', icon: CircleCheck, description: 'Display the simulated recognition.' },
  ]
  if (compact) return (
    <div className="compact-pipeline" aria-label="Detection processing pipeline">
      {steps.map((step, index) => {
        const Icon = step.icon
        const complete = activeStep > index
        const active = activeStep === index
        return <div className={`compact-step ${complete ? 'step-complete' : ''} ${active ? 'step-active' : ''}`} key={step.title}><span className="compact-step-icon">{complete ? <Check size={13} /> : <Icon size={14} />}</span><span>{step.title}</span>{index < steps.length - 1 && <span className="compact-connector" />}</div>
      })}
    </div>
  )
  return (
    <section className="pipeline-section section-wrap" id="pipeline">
      <div className="section-heading pipeline-heading">
        <div><span className="eyebrow">FROM PIXELS TO PLATE</span><h2>ANPR processing pipeline</h2><p>Six stages in a typical automatic number plate recognition workflow.</p></div>
        <span className="pipeline-index">FIG. 01 <span>·</span> PROCESS FLOW</span>
      </div>
      <div className="pipeline-flow">
        {steps.map((step, index) => {
          const Icon = step.icon
          return <div className="pipeline-item" key={step.title}><div className="pipeline-node"><span className="pipeline-icon"><Icon size={20} /></span><span className="pipeline-number">0{index + 1}</span></div><h3>{step.title}</h3><p>{step.description}</p>{index < steps.length - 1 && <ArrowRight className="pipeline-arrow" size={17} />}</div>
        })}
      </div>
      <div className="pipeline-note"><span className="note-marker">i</span><span><strong>Preprocessing</strong> reduces image noise and prepares the frame for plate localization. <strong>OCR</strong> converts characters on the plate into machine-readable text.</span></div>
    </section>
  )
}

export function DetectionResult({ result, cropPreview, onRunAgain, onClear, onExport }) {
  const [exportOpen, setExportOpen] = useState(false)
  return (
    <section className="result-panel" aria-labelledby="result-title">
      <div className="result-topline"><div><span className="result-kicker"><CircleCheck size={14} /> SIMULATION COMPLETE</span><h3 id="result-title">Detection result</h3></div><span className="result-timestamp">{result.time} · {result.imageName}</span></div>
      <div className="result-main">
        <div className="result-plate-block"><span className="result-label">DEMO OCR RESULT</span><strong className="plate-value">{result.plate}</strong><span className="simulated-note"><span /> Simulated recognition · Not a live model</span></div>
        <div className="confidence-block"><div className="confidence-heading"><span>Confidence</span><strong>{result.confidence}<small>%</small></strong></div><div className="confidence-track"><span style={{ width: `${result.confidence}%` }} /></div><div className="confidence-caption"><span>0%</span><span>Demo confidence score</span><span>100%</span></div></div>
        <div className="result-stats"><ResultStat label="Plate status" value="Detected" icon={<CircleCheck size={15} />} /><ResultStat label="Processing" value="Complete" icon={<Check size={15} />} /><ResultStat label="Image quality" value={result.quality} icon={<ScanLine size={15} />} /></div>
      </div>
      <div className="result-bottom">
        <div className="cropped-preview"><span className="crop-label">PLATE CROP PREVIEW</span><div className="plate-crop-window">{cropPreview ? <img src={cropPreview} alt={`Simulated crop of plate ${result.plate}`} /> : <div className="generated-plate"><small>IND</small><strong>{result.plate}</strong></div>}</div><span className="crop-footnote">Browser-side crop · approximate region</span></div>
        <div className="result-actions"><button className="button-outline" onClick={onRunAgain}><ScanLine size={15} /> Run again</button><button className="button-outline" onClick={onClear}><Trash2 size={15} /> Clear image</button><div className="export-menu-wrap"><button className="button-primary export-button" onClick={() => setExportOpen((open) => !open)} aria-expanded={exportOpen}><Download size={15} /> Export result <ChevronDown size={14} /></button>{exportOpen && <div className="export-menu"><button onClick={() => { onExport('json'); setExportOpen(false) }}>Download JSON</button><button onClick={() => { onExport('txt'); setExportOpen(false) }}>Download TXT</button></div>}</div></div>
      </div>
    </section>
  )
}

function ResultStat({ label, value, icon }) {
  return <div className="result-stat"><span>{icon}</span><small>{label}</small><strong>{value}</strong></div>
}

export function DemoSamples({ samples, onSelect }) {
  return (
    <section className="demo-samples">
      <div className="demo-heading"><div><span className="eyebrow">DEMO MODE</span><h3>Try a sample vehicle</h3></div><span className="demo-disclaimer"><Sparkles size={13} /> Predefined demonstration results</span></div>
      <div className="sample-grid">{samples.map((sample, index) => <button className="sample-card" key={sample.id} onClick={() => onSelect(sample)}><span className="sample-thumb"><img src={sample.image} alt="" loading="lazy" /><span className="sample-index">0{index + 1}</span><span className="sample-open"><ArrowUpRight size={15} /></span></span><span className="sample-info"><strong>{sample.label}</strong><small>{sample.plate}</small></span></button>)}</div>
      <p className="sample-footnote">Selecting a sample starts its simulated processing automatically.</p>
    </section>
  )
}

export function HowItWorks() {
  const steps = [
    ['01', 'Capture vehicle image', 'Provide a clear vehicle image as the input frame.'],
    ['02', 'Detect number plate', 'Localize the likely registration plate region.'],
    ['03', 'Crop and preprocess', 'Isolate the plate and prepare it for recognition.'],
    ['04', 'Recognize with OCR', 'Convert visible plate characters into text.'],
  ]
  return (
    <section className="how-section section-wrap" id="how-it-works">
      <div className="section-heading"><div><span className="eyebrow">THE FOUR-STEP VIEW</span><h2>How it works</h2><p>A clear path from a single image to a readable plate.</p></div><span className="pipeline-index">OVERVIEW <span>·</span> 04 STEPS</span></div>
      <div className="how-grid">{steps.map(([number, title, description], index) => <article className="how-step" key={number}><div className="how-step-head"><span className="how-number">{number}</span>{index < steps.length - 1 && <span className="how-rule" />}</div><h3>{title}</h3><p>{description}</p></article>)}</div>
    </section>
  )
}

export function Methodology() {
  const phases = [
    { number: '01', label: 'INPUT', title: 'Vehicle image', detail: 'A still image of a vehicle is provided as the input.' },
    { number: '02', label: 'PROCESSING', title: 'Preprocessing & localization', detail: 'Image preparation and number plate region localization.' },
    { number: '03', label: 'RECOGNITION', title: 'OCR-based recognition', detail: 'Characters in the plate region are converted to text.' },
    { number: '04', label: 'OUTPUT', title: 'Registration number', detail: 'The recognized vehicle registration is presented.' },
  ]
  return (
    <section className="methodology-section" id="methodology">
      <div className="methodology-inner section-wrap">
        <div className="methodology-copy"><span className="eyebrow">RESEARCH FRAMEWORK</span><h2>Proposed methodology</h2><p>The referenced workflow combines image preparation, plate localization and character recognition. This interface illustrates those concepts; it does not execute the research model.</p><div className="technology-label">CONCEPTS DISCUSSED IN THE PAPER</div><div className="technology-list"><span>TensorFlow</span><span>OCR</span><span>Image preprocessing</span><span>Grayscale conversion</span><span>Noise reduction</span></div><small className="methodology-caveat"><span /> TensorFlow is referenced as a research technology only. No model runs in this frontend.</small></div>
        <div className="methodology-flow">{phases.map((phase, index) => <div className="method-phase" key={phase.number}><span className="phase-number">{phase.number}</span><div className="phase-copy"><span>{phase.label}</span><h3>{phase.title}</h3><p>{phase.detail}</p></div>{index < phases.length - 1 && <span className="phase-connector"><ArrowDown size={14} /></span>}</div>)}</div>
      </div>
    </section>
  )
}

export function ResearchResults() {
  return (
    <section className="results-section section-wrap" id="results">
      <div className="section-heading results-heading"><div><span className="eyebrow">PAPER REPORTED METRICS</span><h2>Research results</h2><p>A comparison of values reported by the referenced research paper.</p></div><span className="paper-tag"><FileImage size={14} /> REPORTED IN PAPER</span></div>
      <div className="results-content">
        <div className="accuracy-chart" role="img" aria-label="Reported accuracy: existing system 90 percent, developed methodology 96 percent">
          <div className="chart-title"><span>Reported accuracy</span><span>0–100%</span></div>
          <div className="chart-plot"><div className="chart-y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-bars"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="bar-group"><div className="bar existing-bar"><strong>90%</strong></div><span>Existing system</span></div><div className="bar-group"><div className="bar developed-bar"><strong>96%</strong></div><span>Developed methodology</span></div></div></div>
          <div className="chart-legend"><span><i className="legend-existing" /> Existing system</span><span><i className="legend-developed" /> Developed methodology</span></div>
        </div>
        <div className="results-table-wrap"><div className="table-caption"><span>REPORTED COMPARISON</span><span>n = sample images</span></div><table><thead><tr><th>Method</th><th>Accuracy</th><th>Image samples</th><th>Correct outputs</th></tr></thead><tbody><tr><th>Existing system</th><td>90%</td><td>100</td><td>90</td></tr><tr className="developed-row"><th>Developed methodology</th><td>96%</td><td>300</td><td>293</td></tr></tbody></table><div className="results-footnote"><span className="note-marker">i</span> Values reported in the referenced research paper. This website has not independently reproduced these results.</div></div>
      </div>
    </section>
  )
}

export function Footer() {
  return <footer className="footer"><div className="footer-inner section-wrap"><div className="footer-brand"><a className="brand" href="#dashboard"><span className="brand-icon"><ScanLine size={18} /></span><span className="brand-name">ANPR<span>Vision</span></span></a><p>Automatic Number Plate Recognition<br />Frontend Research Prototype</p><small>Based on concepts presented in the referenced ANPR research paper.</small></div><nav className="footer-nav" aria-label="Footer navigation"><a href="#dashboard">Dashboard</a><a href="#detection">Detection</a><a href="#methodology">Methodology</a><a href="#results">Results</a></nav><div className="footer-status"><span><span className="footer-dot" /> Browser demo</span><small>Frontend only · No live model</small></div></div><div className="footer-bottom section-wrap"><span>ANPR VISION <span>·</span> RESEARCH DEMONSTRATION</span><a href="#dashboard">Back to top <ArrowUpRight size={13} /></a></div></footer>
}